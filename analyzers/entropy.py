"""
Entropy Analyzer
Calculates entropy to detect hidden data and compression artifacts
"""

from PIL import Image
import math
import os
from collections import Counter
from .base import BaseAnalyzer


class EntropyAnalyzer(BaseAnalyzer):
    """Analyze image entropy"""

    def analyze(self, filepath: str, output_dir: str) -> dict:
        """Calculate entropy for the entire image and per channel"""
        img = Image.open(filepath)

        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')

        width, height = img.size
        pixels = img.load()

        results = {
            'overall_entropy': 0,
            'channel_entropy': {},
            'block_entropy': {},
            'suspicious_blocks': [],
            'entropy_map_file': None
        }

        # Calculate overall entropy
        all_values = []
        r_values = []
        g_values = []
        b_values = []

        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]
                all_values.extend([r, g, b])
                r_values.append(r)
                g_values.append(g)
                b_values.append(b)

        results['overall_entropy'] = self._calculate_entropy(all_values)
        results['channel_entropy']['R'] = self._calculate_entropy(r_values)
        results['channel_entropy']['G'] = self._calculate_entropy(g_values)
        results['channel_entropy']['B'] = self._calculate_entropy(b_values)

        # Calculate block-based entropy (8x8 blocks)
        block_size = 8
        block_entropies = []

        for by in range(0, height - block_size, block_size):
            for bx in range(0, width - block_size, block_size):
                block_values = []
                for y in range(by, min(by + block_size, height)):
                    for x in range(bx, min(bx + block_size, width)):
                        r, g, b = pixels[x, y]
                        block_values.extend([r, g, b])

                block_entropy = self._calculate_entropy(block_values)
                block_entropies.append((bx, by, block_entropy))

        if block_entropies:
            avg_block_entropy = sum(e for _, _, e in block_entropies) / len(block_entropies)
            results['block_entropy']['average'] = avg_block_entropy
            results['block_entropy']['min'] = min(e for _, _, e in block_entropies)
            results['block_entropy']['max'] = max(e for _, _, e in block_entropies)

            # Find suspicious blocks (high entropy difference from average)
            threshold = avg_block_entropy * 1.2
            for bx, by, entropy in block_entropies:
                if entropy > threshold:
                    results['suspicious_blocks'].append({
                        'x': bx,
                        'y': by,
                        'entropy': entropy,
                        'difference': entropy - avg_block_entropy
                    })

        # Create entropy visualization
        entropy_map_file = self._create_entropy_map(img, block_size, output_dir)
        if entropy_map_file:
            results['entropy_map_file'] = entropy_map_file

        # Interpretation
        results['interpretation'] = self._interpret_entropy(results)

        return results

    def _calculate_entropy(self, values):
        """Calculate Shannon entropy"""
        if not values:
            return 0.0

        counter = Counter(values)
        total = len(values)

        entropy = 0.0
        for count in counter.values():
            probability = count / total
            if probability > 0:
                entropy -= probability * math.log2(probability)

        return round(entropy, 4)

    def _create_entropy_map(self, img, block_size, output_dir):
        """Create visual entropy map"""
        width, height = img.size
        pixels = img.load()

        map_width = width // block_size
        map_height = height // block_size

        entropy_map = Image.new('L', (map_width, map_height))
        map_pixels = entropy_map.load()

        max_entropy = 0

        # Calculate entropy for each block
        entropies = {}
        for by in range(0, height - block_size, block_size):
            for bx in range(0, width - block_size, block_size):
                block_values = []
                for y in range(by, min(by + block_size, height)):
                    for x in range(bx, min(bx + block_size, width)):
                        r, g, b = pixels[x, y]
                        block_values.extend([r, g, b])

                entropy = self._calculate_entropy(block_values)
                entropies[(bx // block_size, by // block_size)] = entropy
                max_entropy = max(max_entropy, entropy)

        # Normalize and draw
        if max_entropy > 0:
            for (bx, by), entropy in entropies.items():
                if bx < map_width and by < map_height:
                    normalized = int((entropy / max_entropy) * 255)
                    map_pixels[bx, by] = normalized

        # Scale up for visibility
        entropy_map = entropy_map.resize((width, height), Image.NEAREST)

        filename = 'entropy_map.png'
        entropy_map.save(os.path.join(output_dir, filename))
        return filename

    def _interpret_entropy(self, results):
        """Interpret entropy results"""
        overall = results['overall_entropy']
        interpretations = []

        if overall < 3.0:
            interpretations.append("Low entropy - Image has low complexity or repetitive patterns")
        elif overall > 7.5:
            interpretations.append("High entropy - Image is highly complex or may contain encrypted/compressed data")
        else:
            interpretations.append("Normal entropy - Typical for natural images")

        if len(results['suspicious_blocks']) > 0:
            interpretations.append(f"Found {len(results['suspicious_blocks'])} blocks with unusually high entropy")
            interpretations.append("These areas may contain hidden data or compression artifacts")

        # Check channel balance
        channels = results['channel_entropy']
        if max(channels.values()) - min(channels.values()) > 2.0:
            interpretations.append("Significant entropy difference between color channels - Possible steganography")

        return interpretations
