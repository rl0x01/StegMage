"""
Steghide Analyzer
Attempts to extract hidden data using steghide
"""

import subprocess
import shutil
import os
from .base import BaseAnalyzer


class SteghideAnalyzer(BaseAnalyzer):
    """Extract data hidden with steghide"""

    def is_available(self) -> bool:
        """Check if steghide is installed"""
        return shutil.which('steghide') is not None

    def analyze(self, filepath: str, output_dir: str, custom_passwords=None) -> dict:
        """Try to extract data with steghide

        Args:
            filepath: Path to the image file
            output_dir: Directory to save extracted files
            custom_passwords: Optional list of custom passwords to try
        """
        if not self.is_available():
            return {'error': 'steghide not installed'}

        results = {'attempts': []}

        # Use custom passwords if provided, otherwise use defaults
        if custom_passwords:
            passwords = custom_passwords
            results['using_custom_passwords'] = True
        else:
            passwords = ['', 'password', '123456', 'admin', 'root']
            results['using_custom_passwords'] = False

        for password in passwords:
            try:
                output_file = os.path.join(output_dir, f'steghide_extracted_{password or "empty"}.txt')

                cmd = ['steghide', 'extract', '-sf', filepath, '-xf', output_file]
                if password:
                    cmd.extend(['-p', password])
                else:
                    cmd.extend(['-p', ''])

                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                attempt = {
                    'password': password or '(empty)',
                    'success': result.returncode == 0
                }

                if result.returncode == 0:
                    attempt['output_file'] = os.path.basename(output_file)
                    attempt['message'] = 'Data extracted successfully'
                else:
                    attempt['message'] = result.stderr

                results['attempts'].append(attempt)

                # If successful, no need to try other passwords
                if result.returncode == 0:
                    break

            except subprocess.TimeoutExpired:
                results['attempts'].append({
                    'password': password or '(empty)',
                    'success': False,
                    'message': 'Timeout'
                })
            except Exception as e:
                results['attempts'].append({
                    'password': password or '(empty)',
                    'success': False,
                    'message': str(e)
                })

        return results
