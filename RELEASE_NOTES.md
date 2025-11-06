# StegMage - Release Notes

## Version 1.1.0 - Enhanced LSB Visualization (2025-01-XX)

### 🎨 New Features

#### Colorized LSB Bit Plane Analysis
StegMage now generates **beautifully colorized LSB visualizations** that make steganographic patterns easier to identify and analyze!

**What's New:**
- **Channel-Specific Coloring**: Each color channel (R, G, B) is now displayed in its respective color
  - Red channel bit planes → Red visualization
  - Green channel bit planes → Green visualization
  - Blue channel bit planes → Blue visualization

- **RGB Composite Views**: New composite visualizations combine all three channels for each bit plane
  - 8 composite images showing the complete RGB picture for each bit level
  - Easier to spot patterns across all channels simultaneously
  - Ideal for identifying multi-channel steganography

- **Dual Format Output**: Both colored and grayscale versions are generated
  - 24 colored bit planes (8 per channel)
  - 24 grayscale bit planes (for traditional analysis)
  - 8 RGB composite images
  - Total: 56 images per analysis!

### 🎯 Interface Improvements

#### Professional LSB Results Display
- **Color-Coded Sections**: Results organized by channel with matching color themes
- **Interactive Hover Effects**: Images scale and lift on hover for better visibility
- **Visual Hierarchy**: Composites shown first, followed by individual channel analyses
- **Enhanced Tooltips**: Detailed information on hover
- **Better Organization**: Grouped by channel for easier navigation

#### CSS Enhancements
- Smooth transitions and animations
- Black background for maximum contrast with colored planes
- Professional hover effects (lift + shadow + zoom)
- Responsive design maintained across all devices

### 🔧 Technical Improvements

#### LSB Analyzer Core
- Optimized bit extraction algorithm
- Dual-mode image generation (color + grayscale)
- RGB composite generation
- Enhanced metadata with color codes
- Maintained backward compatibility

#### Performance
- Efficient pixel-by-pixel processing
- Optimized image saving operations
- Minimal memory footprint increase
- Same processing time as before

### 📊 Visual Comparison

**Before:**
- 24 grayscale bit plane images
- Difficult to distinguish patterns
- No composite views
- Basic grid layout

**After:**
- 56 total images (24 colored + 24 grayscale + 8 composites)
- Color-coded by channel for instant recognition
- RGB composites for cross-channel analysis
- Professional, organized interface with hover effects
- Much easier pattern identification

### 🎓 Use Cases

This update is particularly useful for:
- **CTF Challenges**: Quickly spot unusual patterns in specific channels
- **Forensic Analysis**: Identify sophisticated multi-channel steganography
- **Research**: Better visualization for academic and research purposes
- **Education**: Teach steganography concepts with clear, colorful examples

### 🚀 Getting Started

Simply upload an image and navigate to the LSB Analysis tab. You'll see:
1. **Image Information**: Dimensions and statistics
2. **RGB Composite Bit Planes**: Combined channel views (NEW!)
3. **R Channel Bit Planes**: Red-colored visualizations (NEW!)
4. **G Channel Bit Planes**: Green-colored visualizations (NEW!)
5. **B Channel Bit Planes**: Blue-colored visualizations (NEW!)

### 📝 Example Output

For a standard 200x200 image:
```
Image Information:
  Dimensions: 200 x 200 pixels
  Color Mode: RGB
  Total Bit Planes Generated: 24 colored + 8 composites

RGB Composite Bit Planes:
  ├─ Composite Bit 0 (LSB)
  ├─ Composite Bit 1
  ├─ ...
  └─ Composite Bit 7 (MSB)

R Channel - Colored Bit Planes:
  ├─ R Bit 0 (LSB) - Red visualization
  ├─ R Bit 1 - Red visualization
  ├─ ...
  └─ R Bit 7 (MSB) - Red visualization

[Same for G and B channels...]
```

### 🐛 Bug Fixes
- Fixed Redis connection handling
- Improved error messages
- Better Docker port configuration (8080 for macOS compatibility)

### 💡 Tips

- **Look at Composites First**: RGB composites often reveal patterns more clearly
- **LSB is Key**: Bit 0 (LSB) is where most simple steganography hides data
- **Check All Channels**: Sometimes data is hidden in only one channel
- **Hover to Zoom**: Hover over any image for a closer look

### 🔮 Coming Soon

- Interactive bit plane comparison
- Side-by-side channel views
- Export all images as ZIP
- Custom color schemes
- Enhanced pattern detection algorithms

---

## Version 1.0.0 - Initial Release

- Multi-layer LSB analysis (grayscale)
- Metadata extraction
- Steghide & Outguess support
- File carving (binwalk, foremost)
- String extraction
- Zsteg analysis
- Docker containerization
- Redis job queue
- Modern dark UI

---

For issues, suggestions, or contributions, visit: https://github.com/rl0x01/StegMage
