# Sketch to Style - AI-Powered Sketch Transformation

A beautiful, modern web application that allows users to upload their sketches and transform them into different artistic styles using AI-powered style transfer.

## Features

- 🎨 **Multiple Art Styles**: Choose from 6 different artistic styles including watercolor, oil painting, digital art, enhanced sketch, cartoon, and realistic
- 📁 **Drag & Drop Upload**: Easy file upload with drag and drop functionality
- 🖼️ **Image Preview**: Preview your uploaded sketch before transformation
- ⚡ **Real-time Processing**: Watch your sketch transform in real-time
- 💾 **Download Results**: Save your transformed artwork
- 📤 **Share Functionality**: Share your creations with others
- 🎯 **Responsive Design**: Works perfectly on desktop and mobile devices
- ⌨️ **Keyboard Shortcuts**: Quick access with keyboard shortcuts

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### Installation

1. Clone or download this repository
2. Open the project folder
3. Double-click on `index.html` or open it in your web browser

### Alternative: Using a Local Server

For the best experience, you can run the application on a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have it installed)
npx serve .

# Using PHP
php -S localhost:8000
```

Then open your browser and navigate to `http://localhost:8000`

## How to Use

### 1. Upload Your Sketch
- **Drag and Drop**: Simply drag your sketch image file onto the upload area
- **Click to Browse**: Click the "Choose File" button to select an image from your computer
- **Supported Formats**: JPG, PNG, GIF, WebP, and other common image formats

### 2. Choose Your Style
- Browse through the 6 available artistic styles
- Click on any style card to select it
- Each style has a unique visual effect:
  - **Watercolor**: Soft, flowing brushstrokes
  - **Oil Painting**: Rich, textured strokes
  - **Digital Art**: Modern, vibrant colors
  - **Enhanced Sketch**: Refined pencil work
  - **Cartoon**: Fun, animated style
  - **Realistic**: Photorealistic rendering

### 3. Transform Your Sketch
- Click the "Transform Sketch" button
- Watch the loading animation as your sketch is processed
- Your transformed artwork will appear below

### 4. Download and Share
- **Download**: Save your transformed artwork to your computer
- **Share**: Share your creation on social media or via link
- **New Sketch**: Start over with a new sketch

## Keyboard Shortcuts

- `Ctrl/Cmd + O`: Open file browser
- `Ctrl/Cmd + Enter`: Transform sketch (when ready)
- `Ctrl/Cmd + Escape`: Reset application

## Technical Details

### Current Implementation
This is a **frontend prototype** that demonstrates the user interface and user experience. The actual AI transformation is currently simulated with mock results.

### Future Enhancements
To make this a fully functional application, you would need to:

1. **Integrate AI APIs**: Connect to services like:
   - OpenAI's DALL-E API
   - Stability AI's API
   - Google's Imagen API
   - Custom trained models

2. **Backend Development**: Create a server to handle:
   - File uploads
   - API calls to AI services
   - Image processing
   - User authentication (optional)

3. **Database Integration**: Store user uploads and results (optional)

### File Structure
```
sketch-to-style-app/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Improving the UI/UX
- Adding new art styles
- Optimizing performance

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Icons provided by Font Awesome
- Fonts provided by Google Fonts
- Sample images from Unsplash
- Gradient backgrounds inspired by modern design trends

---

**Note**: This is a demonstration application. For production use, you would need to integrate with actual AI services for sketch transformation.
