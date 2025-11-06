"""
Metadata Analyzer
Extracts EXIF and other metadata using exiftool
"""

import subprocess
import json
import shutil
from .base import BaseAnalyzer


class MetadataAnalyzer(BaseAnalyzer):
    """Extract metadata from images"""

    def is_available(self) -> bool:
        """Check if exiftool is installed"""
        return shutil.which('exiftool') is not None

    def analyze(self, filepath: str, output_dir: str) -> dict:
        """Extract metadata using exiftool"""
        if not self.is_available():
            return {'error': 'exiftool not installed'}

        try:
            # Run exiftool
            result = subprocess.run(
                ['exiftool', '-j', filepath],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                metadata = json.loads(result.stdout)
                return {
                    'metadata': metadata[0] if metadata else {},
                    'raw_output': result.stdout
                }
            else:
                return {
                    'error': 'exiftool failed',
                    'stderr': result.stderr
                }

        except subprocess.TimeoutExpired:
            return {'error': 'exiftool timeout'}
        except Exception as e:
            return {'error': str(e)}
