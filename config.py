"""
StegMage Configuration
"""

import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Flask Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# File Upload Configuration
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', BASE_DIR / 'uploads')
RESULTS_FOLDER = os.environ.get('RESULTS_FOLDER', BASE_DIR / 'results')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'tif', 'jfif'}

# Redis Configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# PostgreSQL Configuration (optional for persistent storage)
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://stegmage:stegmage@localhost/stegmage')

# Analysis Configuration
ANALYSIS_TIMEOUT = int(os.environ.get('ANALYSIS_TIMEOUT', '600'))  # 10 minutes
MAX_WORKERS = int(os.environ.get('MAX_WORKERS', '4'))

# Tool Paths (can be customized)
TOOL_PATHS = {
    'steghide': os.environ.get('STEGHIDE_PATH', 'steghide'),
    'outguess': os.environ.get('OUTGUESS_PATH', 'outguess'),
    'exiftool': os.environ.get('EXIFTOOL_PATH', 'exiftool'),
    'binwalk': os.environ.get('BINWALK_PATH', 'binwalk'),
    'foremost': os.environ.get('FOREMOST_PATH', 'foremost'),
    'zsteg': os.environ.get('ZSTEG_PATH', 'zsteg'),
    'strings': os.environ.get('STRINGS_PATH', 'strings'),
}

# Feature Flags
ENABLE_LSB_ANALYSIS = os.environ.get('ENABLE_LSB_ANALYSIS', 'True').lower() == 'true'
ENABLE_METADATA = os.environ.get('ENABLE_METADATA', 'True').lower() == 'true'
ENABLE_FILE_CARVING = os.environ.get('ENABLE_FILE_CARVING', 'True').lower() == 'true'
ENABLE_STEGHIDE = os.environ.get('ENABLE_STEGHIDE', 'True').lower() == 'true'
ENABLE_OUTGUESS = os.environ.get('ENABLE_OUTGUESS', 'True').lower() == 'true'
ENABLE_ZSTEG = os.environ.get('ENABLE_ZSTEG', 'True').lower() == 'true'
