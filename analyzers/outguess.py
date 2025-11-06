"""
Outguess Analyzer
Attempts to extract hidden data using outguess
"""

import subprocess
import shutil
import os
from .base import BaseAnalyzer


class OutguessAnalyzer(BaseAnalyzer):
    """Extract data hidden with outguess"""

    def is_available(self) -> bool:
        """Check if outguess is installed"""
        return shutil.which('outguess') is not None

    def analyze(self, filepath: str, output_dir: str) -> dict:
        """Try to extract data with outguess"""
        if not self.is_available():
            return {'error': 'outguess not installed'}

        try:
            output_file = os.path.join(output_dir, 'outguess_extracted.txt')

            result = subprocess.run(
                ['outguess', '-r', filepath, output_file],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0 and os.path.exists(output_file):
                with open(output_file, 'rb') as f:
                    content = f.read()

                return {
                    'success': True,
                    'output_file': os.path.basename(output_file),
                    'size': len(content),
                    'preview': content[:500].decode('utf-8', errors='replace')
                }
            else:
                return {
                    'success': False,
                    'message': 'No hidden data found or extraction failed',
                    'stderr': result.stderr
                }

        except subprocess.TimeoutExpired:
            return {'error': 'outguess timeout'}
        except Exception as e:
            return {'error': str(e)}
