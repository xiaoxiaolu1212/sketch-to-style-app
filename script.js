// ===== UI refs =====
const fileInput = document.getElementById("fileInput");
const uploadArea = document.getElementById("uploadArea");
const previewContainer = document.getElementById("previewContainer");
const previewImage = document.getElementById("previewImage");
const removeBtn = document.getElementById("removeBtn");
const transformBtn = document.getElementById("transformBtn");
const resultSection = document.getElementById("resultSection");
const resultImage = document.getElementById("resultImage");
const loadingOverlay = document.getElementById("loadingOverlay");

const extraPromptEl = document.getElementById("extraPrompt");
const stepsEl = document.getElementById("steps");
const guidanceEl = document.getElementById("guidance");
const imgGuidanceEl = document.getElementById("imgGuidance");
const seedEl = document.getElementById("seed");

// ===== State =====
let selectedFile = null;
let selectedStyle = null;

// ===== Helpers =====
function showLoading(on) {
  loadingOverlay.style.display = on ? "flex" : "none";
}

function showNotification(msg, type = "info") {
  // minimal toast
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `
    position: fixed; top: 16px; right: 16px; background: ${type === "error" ? "#dc3545" : "#2b6cb0"};
    color: #fff; padding: 10px 14px; border-radius: 8px; z-index: 9999;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function updateTransformButton() {
  transformBtn.disabled = !(selectedFile && selectedStyle);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      resolve(s.includes(",") ? s.split(",")[1] : s); // strip data: prefix
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ===== Upload wiring =====
fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showNotification("Please choose an image file.", "error");
    return;
  }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    previewContainer.style.display = "block";
  };
  reader.readAsDataURL(file);
  updateTransformButton();
});

uploadArea.addEventListener("click", () => fileInput.click());
uploadArea.addEventListener("dragover", (e) => { e.preventDefault(); });
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    previewContainer.style.display = "block";
  };
  reader.readAsDataURL(file);
  updateTransformButton();
});

removeBtn.addEventListener("click", () => {
  selectedFile = null;
  fileInput.value = "";
  previewContainer.style.display = "none";
  previewImage.src = "";
  updateTransformButton();
});

// ===== Style selection =====
document.querySelectorAll(".style-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".style-card").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedStyle = btn.dataset.style;
    updateTransformButton();
  });
});

// ===== Transform action =====
transformBtn.addEventListener("click", transformSketch);

async function transformSketch() {
  if (!selectedFile || !selectedStyle) {
    showNotification("Please select both an image and a style.", "error");
    return;
  }

  try {
    showLoading(true);
    transformBtn.disabled = true;

    const imageBase64 = await fileToBase64(selectedFile);
    const payload = {
      imageBase64,
      style: selectedStyle,
      extra: (extraPromptEl?.value || "").trim(),
      steps: Number(stepsEl?.value ?? 15) || 15,
      guidance: Number(guidanceEl?.value ?? 7) || 7,
      img_guidance: Number(imgGuidanceEl?.value ?? 1.5) || 1.5,
      seed: Number(seedEl?.value ?? -1) || -1,
    };

    const res = await fetch("/api/transform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    if (!json?.image) throw new Error("No image returned.");

    resultImage.src = json.image; // already a data URL
    resultSection.style.display = "block";
    resultSection.scrollIntoView({ behavior: "smooth" });
    showNotification("Sketch transformed successfully!", "success");
  } catch (err) {
    console.error(err);
    showNotification("Transform failed: " + err.message, "error");
  } finally {
    showLoading(false);
    transformBtn.disabled = false;
  }
}

// Initial state
updateTransformButton();

