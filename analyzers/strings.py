"""
Strings Analyzer
Extracts readable ASCII strings from image data
"""

import subprocess
import os
from .base import BaseAnalyzer


class StringsAnalyzer(BaseAnalyzer):
    """Extract readable strings from image file"""

    def analyze(self, filepath: str, output_dir: str) -> dict:
        """Extract strings using the strings command"""
        try:
            # Run strings command
            result = subprocess.run(
                ['strings', '-n', '8', filepath],  # Min length 8 characters
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                strings_list = result.stdout.split('\n')
                strings_list = [s.strip() for s in strings_list if s.strip()]

                # Save to file
                output_file = os.path.join(output_dir, 'strings.txt')
                with open(output_file, 'w') as f:
                    f.write('\n'.join(strings_list))

                return {
                    'success': True,
                    'count': len(strings_list),
                    'strings': strings_list[:100],  # First 100 strings
                    'output_file': 'strings.txt'
                }
            else:
                return {
                    'success': False,
                    'error': result.stderr
                }

        except subprocess.TimeoutExpired:
            return {'error': 'strings command timeout'}
        except Exception as e:
            return {'error': str(e)}
