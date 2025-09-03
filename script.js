// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const styleCards = document.querySelectorAll('.style-card');
const transformBtn = document.getElementById('transformBtn');
const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const newSketchBtn = document.getElementById('newSketchBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// State variables
let selectedFile = null;
let selectedStyle = null;

// Event listeners
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
removeBtn.addEventListener('click', removeFile);

// Drag and drop functionality
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);

// Style selection
styleCards.forEach(card => {
    card.addEventListener('click', () => selectStyle(card));
});

// Transform button
transformBtn.addEventListener('click', transformSketch);

// Result actions
downloadBtn.addEventListener('click', downloadResult);
shareBtn.addEventListener('click', shareResult);
newSketchBtn.addEventListener('click', resetApp);

// File handling functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    } else {
        showNotification('Please select a valid image file.', 'error');
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            processFile(file);
        } else {
            showNotification('Please drop a valid image file.', 'error');
        }
    }
}

function processFile(file) {
    selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewContainer.style.display = 'block';
        uploadArea.style.display = 'none';
        updateTransformButton();
    };
    reader.readAsDataURL(file);
}

function removeFile() {
    selectedFile = null;
    previewContainer.style.display = 'none';
    uploadArea.style.display = 'block';
    fileInput.value = '';
    updateTransformButton();
}

// Style selection functions
function selectStyle(card) {
    // Remove previous selection
    styleCards.forEach(c => c.classList.remove('selected'));
    
    // Add selection to clicked card
    card.classList.add('selected');
    selectedStyle = card.dataset.style;
    
    updateTransformButton();
}

// Transform functions
function updateTransformButton() {
    transformBtn.disabled = !(selectedFile && selectedStyle);
}

async function transformSketch() {
    if (!selectedFile || !selectedStyle) {
        showNotification('Please select both an image and a style.', 'error');
        return;
    }

    showLoading(true);
    transformBtn.disabled = true;

    try {
        // Convert the uploaded file to base64 (without the prefix)
        const base64 = await fileToBase64(selectedFile);

        // Call your Vercel backend function
        const response = await fetch("https://sketch-to-style-app.vercel.app/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64, style: selectedStyle })
        });
if (!response.ok) {
    const txt = await response.text().catch(() => "");
    const msg = txt || `${response.status} ${response.statusText}`;
    console.error("Transform failed:", msg);
    showNotification("Transform failed: " + msg, "error");
    return;
}


        // Show the returned image
        const blob = await response.blob();
        resultImage.src = URL.createObjectURL(blob);
        resultSection.style.display = "block";
        resultSection.scrollIntoView({ behavior: "smooth" });

        showNotification("Sketch transformed successfully!", "success");
    } catch (err) {
        console.error(err);
        showNotification("Network error: " + err.message, "error");
    } finally {
        showLoading(false);
        transformBtn.disabled = false;
    }
}

// helper to get base64 (strip prefix)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Loading functions
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Result action functions
function downloadResult() {
    const link = document.createElement('a');
    link.href = resultImage.src;
    link.download = `sketch-${selectedStyle}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Download started!', 'success');
}

function shareResult() {
    if (navigator.share) {
        navigator.share({
            title: 'My Transformed Sketch',
            text: 'Check out my sketch transformed with AI!',
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        });
    }
}

function resetApp() {
    // Reset all state
    selectedFile = null;
    selectedStyle = null;
    
    // Reset UI
    previewContainer.style.display = 'none';
    uploadArea.style.display = 'block';
    fileInput.value = '';
    resultSection.style.display = 'none';
    
    // Reset style selection
    styleCards.forEach(card => card.classList.remove('selected'));
    
    // Reset transform button
    updateTransformButton();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showNotification('Ready for a new sketch!', 'success');
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    updateTransformButton();
    
    // Add some interactive effects
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'o':
                    e.preventDefault();
                    fileInput.click();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (!transformBtn.disabled) {
                        transformSketch();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    resetApp();
                    break;
            }
        }
    });
});

// Add some visual feedback for better UX
function addVisualFeedback() {
    // Add hover effects to style cards
    styleCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'translateY(-3px) scale(1.02)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'translateY(0) scale(1)';
            }
        });
    });
}

// Call visual feedback function
addVisualFeedback();
