"""
File Carving Analyzer
Extracts embedded files using binwalk and foremost
"""

import subprocess
import shutil
import os
from pathlib import Path
from .base import BaseAnalyzer


class FileCarvingAnalyzer(BaseAnalyzer):
    """Extract embedded files from images"""

    def analyze(self, filepath: str, output_dir: str) -> dict:
        """Run binwalk and foremost to find embedded files"""
        results = {}

        # Try binwalk
        if shutil.which('binwalk'):
            results['binwalk'] = self._run_binwalk(filepath, output_dir)
        else:
            results['binwalk'] = {'error': 'binwalk not installed'}

        # Try foremost
        if shutil.which('foremost'):
            results['foremost'] = self._run_foremost(filepath, output_dir)
        else:
            results['foremost'] = {'error': 'foremost not installed'}

        return results

    def _run_binwalk(self, filepath: str, output_dir: str) -> dict:
        """Run binwalk analysis"""
        try:
            binwalk_dir = os.path.join(output_dir, 'binwalk')
            os.makedirs(binwalk_dir, exist_ok=True)

            # Run binwalk extraction
            result = subprocess.run(
                ['binwalk', '-e', '-C', binwalk_dir, filepath],
                capture_output=True,
                text=True,
                timeout=60
            )

            # Get list of extracted files
            extracted_files = []
            if os.path.exists(binwalk_dir):
                for root, dirs, files in os.walk(binwalk_dir):
                    for file in files:
                        rel_path = os.path.relpath(os.path.join(root, file), output_dir)
                        extracted_files.append(rel_path)

            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'extracted_files': extracted_files
            }

        except subprocess.TimeoutExpired:
            return {'error': 'binwalk timeout'}
        except Exception as e:
            return {'error': str(e)}

    def _run_foremost(self, filepath: str, output_dir: str) -> dict:
        """Run foremost analysis"""
        try:
            foremost_dir = os.path.join(output_dir, 'foremost')
            os.makedirs(foremost_dir, exist_ok=True)

            # Run foremost
            result = subprocess.run(
                ['foremost', '-o', foremost_dir, '-i', filepath],
                capture_output=True,
                text=True,
                timeout=60
            )

            # Get list of extracted files
            extracted_files = []
            if os.path.exists(foremost_dir):
                for root, dirs, files in os.walk(foremost_dir):
                    for file in files:
                        if file != 'audit.txt':
                            rel_path = os.path.relpath(os.path.join(root, file), output_dir)
                            extracted_files.append(rel_path)

            return {
                'success': result.returncode == 0,
                'extracted_files': extracted_files
            }

        except subprocess.TimeoutExpired:
            return {'error': 'foremost timeout'}
        except Exception as e:
            return {'error': str(e)}
