"""
LSB (Least Significant Bit) Analyzer
Extracts and visualizes bit planes from images
"""

from PIL import Image
import os
from pathlib import Path
from .base import BaseAnalyzer


class LSBAnalyzer(BaseAnalyzer):
    """Analyze and extract LSB data from images"""

    def analyze(self, filepath: str, output_dir: str) -> dict:
        """Extract LSB data from all color channels and bit planes"""
        img = Image.open(filepath)

        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')

        width, height = img.size
        pixels = img.load()

        results = {
            'width': width,
            'height': height,
            'mode': img.mode,
            'bit_planes': []
        }

        # Extract bit planes for each channel
        channels = ['R', 'G', 'B']
        for channel_idx, channel_name in enumerate(channels):
            for bit in range(8):
                bit_plane_img = Image.new('L', (width, height))
                bit_plane_pixels = bit_plane_img.load()

                for y in range(height):
                    for x in range(width):
                        pixel_value = pixels[x, y][channel_idx]
                        bit_value = (pixel_value >> bit) & 1
                        bit_plane_pixels[x, y] = bit_value * 255

                # Save bit plane image
                output_filename = f"lsb_{channel_name}{bit}.png"
                output_path = os.path.join(output_dir, output_filename)
                bit_plane_img.save(output_path)

                results['bit_planes'].append({
                    'channel': channel_name,
                    'bit': bit,
                    'filename': output_filename
                })

        return results
