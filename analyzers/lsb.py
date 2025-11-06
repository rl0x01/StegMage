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
            'bit_planes': [],
            'composite_planes': []
        }

        # Color maps for each channel (R, G, B)
        color_maps = {
            'R': (255, 0, 0),    # Red
            'G': (0, 255, 0),    # Green
            'B': (0, 0, 255)     # Blue
        }

        # Extract bit planes for each channel
        channels = ['R', 'G', 'B']
        for channel_idx, channel_name in enumerate(channels):
            for bit in range(8):
                # Create grayscale version
                bit_plane_gray = Image.new('L', (width, height))
                bit_plane_gray_pixels = bit_plane_gray.load()

                # Create colored version
                bit_plane_color = Image.new('RGB', (width, height))
                bit_plane_color_pixels = bit_plane_color.load()

                base_color = color_maps[channel_name]

                for y in range(height):
                    for x in range(width):
                        pixel_value = pixels[x, y][channel_idx]
                        bit_value = (pixel_value >> bit) & 1

                        # Grayscale version
                        bit_plane_gray_pixels[x, y] = bit_value * 255

                        # Colored version - apply channel color only where bit is set
                        if bit_value:
                            bit_plane_color_pixels[x, y] = base_color
                        else:
                            bit_plane_color_pixels[x, y] = (0, 0, 0)

                # Save grayscale bit plane image
                output_filename_gray = f"lsb_{channel_name}{bit}_gray.png"
                output_path_gray = os.path.join(output_dir, output_filename_gray)
                bit_plane_gray.save(output_path_gray)

                # Save colored bit plane image
                output_filename_color = f"lsb_{channel_name}{bit}.png"
                output_path_color = os.path.join(output_dir, output_filename_color)
                bit_plane_color.save(output_path_color)

                results['bit_planes'].append({
                    'channel': channel_name,
                    'bit': bit,
                    'filename': output_filename_color,
                    'filename_gray': output_filename_gray,
                    'color': '#{:02x}{:02x}{:02x}'.format(*base_color)
                })

        # Create composite views combining all channels for each bit
        for bit in range(8):
            composite = Image.new('RGB', (width, height))
            composite_pixels = composite.load()

            for y in range(height):
                for x in range(width):
                    r_bit = (pixels[x, y][0] >> bit) & 1
                    g_bit = (pixels[x, y][1] >> bit) & 1
                    b_bit = (pixels[x, y][2] >> bit) & 1

                    composite_pixels[x, y] = (r_bit * 255, g_bit * 255, b_bit * 255)

            composite_filename = f"lsb_composite_bit{bit}.png"
            composite_path = os.path.join(output_dir, composite_filename)
            composite.save(composite_path)

            results['composite_planes'].append({
                'bit': bit,
                'filename': composite_filename
            })

        return results
