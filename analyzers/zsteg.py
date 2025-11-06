"""
Zsteg Analyzer
Detects LSB steganography in PNG and BMP images
"""

import subprocess
import shutil
from .base import BaseAnalyzer


class ZstegAnalyzer(BaseAnalyzer):
    """Analyze images using zsteg"""

    def is_available(self) -> bool:
        """Check if zsteg is installed"""
        return shutil.which('zsteg') is not None

    def analyze(self, filepath: str, output_dir: str) -> dict:
        """Run zsteg analysis"""
        if not self.is_available():
            return {'error': 'zsteg not installed (requires Ruby: gem install zsteg)'}

        try:
            # Run zsteg with all analysis modes
            result = subprocess.run(
                ['zsteg', '-a', filepath],
                capture_output=True,
                text=True,
                timeout=60
            )

            output_lines = result.stdout.split('\n')
            findings = []

            for line in output_lines:
                line = line.strip()
                if line and not line.startswith('['):
                    findings.append(line)

            return {
                'success': True,
                'findings': findings,
                'raw_output': result.stdout
            }

        except subprocess.TimeoutExpired:
            return {'error': 'zsteg timeout'}
        except Exception as e:
            return {'error': str(e)}
