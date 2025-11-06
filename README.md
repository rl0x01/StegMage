# StegMage 🔮

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)

**StegMage** is a powerful open-source steganography analysis platform designed to detect and extract hidden data from images. Built for cybersecurity professionals, CTF players, and digital forensics experts.

## ✨ Features

- 🔍 **Multi-Layer Analysis**: Examine individual bit layers across RGB color channels
- 🎯 **LSB Detection**: Detect and extract Least Significant Bit encoded data
- 🔓 **Password Recovery**: Extract hidden files using steghide, outguess, and more
- 📊 **Metadata Extraction**: Comprehensive EXIF and metadata analysis
- 🗂️ **File Carving**: Identify embedded files with binwalk and foremost
- 📝 **String Analysis**: Extract readable text from image data
- 🎨 **Visual Analysis**: Interactive bit-plane visualization
- ⚡ **Fast Processing**: Redis-powered job queue for efficient analysis

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/rl0x01/StegMage.git
cd StegMage

# Start the application
docker compose up -d

# Access the platform
open http://localhost:8080
```

> **Note pour macOS**: Le port 8080 est utilisé car le port 5000 est réservé par le service AirPlay d'Apple.

### Manual Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Install steganography tools
sudo apt-get install steghide outguess exiftool binwalk foremost

# Install zsteg (Ruby)
gem install zsteg

# Run the application
python app.py
```

## 📋 Supported Formats

- PNG
- JPEG/JPG
- GIF
- BMP
- TIFF
- JFIF

## 🛠️ Technology Stack

- **Backend**: Python 3.11+ with Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **Queue**: Redis
- **Database**: PostgreSQL
- **Containers**: Docker & Docker Compose
- **Analysis Tools**: zsteg, steghide, outguess, exiftool, binwalk, foremost

## 📖 Usage

1. Upload an image file through the web interface
2. Wait for automatic analysis across all detection methods
3. Review results in organized tabs
4. Download extracted files and layer images
5. Try password-protected extraction with custom wordlists

## 🧪 Development

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run linters
black .
flake8 .
pylint app/
mypy app/

# Run tests
pytest
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Inspired by [AperiSolve](https://github.com/Zeecka/AperiSolve) - a fantastic steganography analysis platform.

## ⚠️ Disclaimer

This tool is designed for educational purposes, cybersecurity research, and authorized security testing only. Always ensure you have permission before analyzing files that don't belong to you.

---

Made with 🔮 by StegMage Team
