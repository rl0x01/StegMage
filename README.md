# StegMage

**Professional Steganography Analysis Platform**

Une plateforme d'analyse steganographique complète et sécurisée pour la détection et l'extraction de données cachées dans les images.

[![Security](https://img.shields.io/badge/Security-96%2F100-brightgreen)](SECURITY.md)
[![CapRover](https://img.shields.io/badge/Deploy-CapRover-blue)](CAPROVER_DEPLOY.md)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/License-Educational-orange)]()

## ✨ Features

- 🔍 **Multi-Layer Analysis**: Examine individual bit layers across RGB color channels
- 🎯 **LSB Detection**: Detect and extract Least Significant Bit encoded data
- 🔓 **Password Recovery**: Extract hidden files using steghide, outguess, and more
- 📊 **Metadata Extraction**: Comprehensive EXIF and metadata analysis
- 🗂️ **File Carving**: Identify embedded files with binwalk and foremost
- 📝 **String Analysis**: Extract readable text from image data
- 🎨 **Visual Analysis**: Interactive bit-plane visualization
- ⚡ **Fast Processing**: Redis-powered job queue for efficient analysis

---

## 🚀 Déploiement Rapide

### Option 1: CapRover (Production - Recommandé)

```bash
# 1. Installer CapRover CLI
npm install -g caprover

# 2. Se connecter à votre serveur
caprover login

# 3. Déployer
./deploy.sh
```

📖 **[Guide Complet CapRover](CAPROVER_DEPLOY.md)**

### Option 2: Docker Compose (Local/Dev)

```bash
# 1. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 2. Démarrer l'application
docker compose up -d

# 3. Accéder à l'interface
http://localhost:8080
```

> **Note macOS**: Port 8080 utilisé (port 5000 réservé par AirPlay)

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

---

## 🔐 Sécurité

StegMage intègre une sécurité de niveau entreprise:

✅ **Authentication** - Protection par mot de passe SHA-256
✅ **Rate Limiting** - Anti brute force (5 tentatives max)
✅ **File Validation** - Vérification multi-couches (MIME, PIL, taille)
✅ **HTTPS Enforcement** - Redirection automatique
✅ **Security Headers** - CSP, HSTS, X-Frame-Options
✅ **Audit Logging** - Traçabilité complète

**Score de Sécurité: 96/100** ⭐⭐⭐⭐⭐

📖 **[Rapport de Sécurité Complet](SECURITY.md)**

---

## ⚙️ Configuration Production

### Variables d'Environnement Obligatoires

```bash
SECRET_KEY=<généré>           # python3 -c "import secrets; print(secrets.token_hex(32))"
AUTH_PASSWORD=<votre-mdp>     # Mot de passe fort (16+ chars)
FORCE_HTTPS=true              # Forcer HTTPS
ALLOWED_ORIGINS=https://...   # Votre domaine
REDIS_URL=redis://...         # URL Redis
```

### Checklist Déploiement

- [ ] Redis déployé et accessible
- [ ] Variables d'environnement configurées
- [ ] HTTPS/SSL activé (Let's Encrypt)
- [ ] SECRET_KEY généré aléatoirement
- [ ] AUTH_PASSWORD fort et unique
- [ ] ALLOWED_ORIGINS restreint au domaine
- [ ] DEBUG=false
- [ ] Logs et monitoring configurés

📖 **[Guide Déploiement](CAPROVER_DEPLOY.md)** | **[Config Production](DEPLOYMENT.md)**

---

## 📖 Documentation

- **[Guide CapRover](CAPROVER_DEPLOY.md)** - Déploiement production
- **[Sécurité](SECURITY.md)** - Audit et recommandations
- **[Deployment](DEPLOYMENT.md)** - Configuration avancée
- **[Env Variables](.env.example)** - Toutes les variables

---

## ⚠️ Disclaimer

Cette plateforme est destinée à des **fins éducatives et tests de sécurité autorisés uniquement**. L'utilisation pour des activités malveillantes est strictement interdite.

**⚠️ IMPORTANT:** Toujours obtenir l'autorisation avant d'analyser des fichiers qui ne vous appartiennent pas.

---

## 👨‍💻 Développé Par

**NetMeSafe** - Plateforme professionnelle d'analyse steganographique avec sécurité de niveau entreprise.

---

Made with 🔮 by NetMeSafe
