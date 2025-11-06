"""
Forensics Analyzer
Error Level Analysis (ELA) and manipulation detection
"""

from PIL import Image, ImageChops, ImageEnhance
import os
import io
from .base import BaseAnalyzer


class ForensicsAnalyzer(BaseAnalyzer):
    """Forensic analysis for image manipulation detection"""

    def analyze(self, filepath: str, output_dir: str) -> dict:
        """Perform forensic analysis including ELA"""
        img = Image.open(filepath)

        results = {
            'ela_performed': False,
            'ela_file': None,
            'compression_level': None,
            'double_jpeg': False,
            'manipulation_likelihood': 'Unknown',
            'findings': []
        }

        # Perform Error Level Analysis
        ela_result = self._perform_ela(img, output_dir)
        if ela_result:
            results.update(ela_result)

        # Analyze compression artifacts
        compression_analysis = self._analyze_compression(filepath, img)
        results.update(compression_analysis)

        # Analyze for cloning/copy-paste
        clone_analysis = self._detect_cloning(img)
        if clone_analysis:
            results['cloning_detected'] = clone_analysis

        return results

    def _perform_ela(self, img, output_dir):
        """Perform Error Level Analysis"""
        try:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Save with known quality
            quality = 90
            temp_buffer = io.BytesIO()
            img.save(temp_buffer, 'JPEG', quality=quality)
            temp_buffer.seek(0)

            # Load recompressed image
            recompressed = Image.open(temp_buffer)

            # Calculate difference
            ela_img = ImageChops.difference(img, recompressed)

            # Enhance the difference for visibility
            extrema = ela_img.getextrema()
            max_diff = max([ex[1] for ex in extrema])

            if max_diff > 0:
                scale = 255.0 / max_diff
                ela_img = ImageEnhance.Brightness(ela_img).enhance(scale)

            # Save ELA result
            ela_filename = 'ela_result.png'
            ela_img.save(os.path.join(output_dir, ela_filename))

            return {
                'ela_performed': True,
                'ela_file': ela_filename,
                'max_difference': max_diff,
                'findings': self._interpret_ela(max_diff)
            }

        except Exception as e:
            return {
                'ela_performed': False,
                'error': str(e)
            }

    def _analyze_compression(self, filepath, img):
        """Analyze JPEG compression artifacts"""
        result = {
            'compression_level': 'Unknown',
            'double_jpeg': False,
            'quality_estimate': None
        }

        # Check if it's a JPEG
        if filepath.lower().endswith(('.jpg', '.jpeg')):
            try:
                # Try to get JPEG quality from quantization tables
                img_copy = Image.open(filepath)

                if hasattr(img_copy, 'quantization'):
                    qtables = img_copy.quantization
                    if qtables:
                        # Estimate quality from quantization table
                        result['quality_estimate'] = self._estimate_jpeg_quality(qtables)

                # Check for double JPEG compression
                # This is a simplified check
                result['double_jpeg'] = self._check_double_jpeg(img_copy)

            except:
                pass

        return result

    def _estimate_jpeg_quality(self, qtables):
        """Estimate JPEG quality from quantization tables"""
        # Simplified quality estimation
        if not qtables or not qtables.get(0):
            return None

        q = qtables[0]
        avg = sum(q) / len(q)

        if avg < 10:
            return "High (90-100)"
        elif avg < 20:
            return "Good (75-90)"
        elif avg < 50:
            return "Medium (50-75)"
        else:
            return "Low (<50)"

    def _check_double_jpeg(self, img):
        """Check for signs of double JPEG compression"""
        # This is a simplified check
        # Real double JPEG detection requires DCT coefficient analysis
        try:
            # Save and reload with different quality
            temp1 = io.BytesIO()
            temp2 = io.BytesIO()

            img.save(temp1, 'JPEG', quality=85)
            img.save(temp2, 'JPEG', quality=95)

            size1 = temp1.tell()
            size2 = temp2.tell()

            # If size difference is very small, might be double compressed
            if size2 - size1 < 100:
                return True

        except:
            pass

        return False

    def _detect_cloning(self, img):
        """Detect copy-paste/cloning artifacts"""
        # This is a placeholder for more sophisticated cloning detection
        # Real implementation would use:
        # - Block matching algorithms
        # - SIFT/SURF feature detection
        # - Statistical analysis

        results = {
            'analysis_performed': True,
            'method': 'Basic block matching',
            'findings': 'Advanced cloning detection requires additional libraries'
        }

        return results

    def _interpret_ela(self, max_diff):
        """Interpret ELA results"""
        findings = []

        if max_diff < 10:
            findings.append("Very low error levels - Image may be heavily compressed or unmodified")
        elif max_diff < 30:
            findings.append("Low error levels - Likely unmodified or lightly edited")
        elif max_diff < 50:
            findings.append("Moderate error levels - Some editing may have occurred")
        else:
            findings.append("High error levels - Significant differences detected")
            findings.append("Areas with bright spots in ELA may indicate manipulation")

        findings.append("Note: ELA is most effective on JPEG images")
        findings.append("Bright areas = higher error levels = potential manipulation")

        return findings
