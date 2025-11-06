"""
Color Analysis Analyzer
Analyzes color palette, histograms, and color distribution
"""

from PIL import Image
import os
from collections import Counter
from .base import BaseAnalyzer


class ColorAnalyzer(BaseAnalyzer):
    """Analyze color palette and distribution"""

    def analyze(self, filepath: str, output_dir: str) -> dict:
        """Analyze color palette and create histograms"""
        img = Image.open(filepath)

        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')

        width, height = img.size
        pixels = img.load()

        results = {
            'width': width,
            'height': height,
            'total_pixels': width * height,
            'dominant_colors': [],
            'unique_colors': 0,
            'color_diversity': 0,
            'histograms': {}
        }

        # Collect all colors
        colors = []
        for y in range(height):
            for x in range(width):
                colors.append(pixels[x, y])

        # Count unique colors
        color_counts = Counter(colors)
        results['unique_colors'] = len(color_counts)
        results['color_diversity'] = len(color_counts) / (width * height)

        # Get top 10 dominant colors
        dominant = color_counts.most_common(10)
        for color, count in dominant:
            percentage = (count / (width * height)) * 100
            results['dominant_colors'].append({
                'rgb': color,
                'hex': '#{:02x}{:02x}{:02x}'.format(*color),
                'count': count,
                'percentage': round(percentage, 2)
            })

        # Create RGB histograms
        self._create_histograms(img, output_dir, results)

        # Create color palette image
        self._create_palette_image(results['dominant_colors'], output_dir)

        return results

    def _create_histograms(self, img, output_dir, results):
        """Create RGB histogram images"""
        width, height = img.size
        pixels = img.load()

        # Initialize histogram bins
        r_hist = [0] * 256
        g_hist = [0] * 256
        b_hist = [0] * 256

        # Count pixel values
        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]
                r_hist[r] += 1
                g_hist[g] += 1
                b_hist[b] += 1

        # Create histogram images
        hist_width = 512
        hist_height = 256

        for channel, hist, color in [('R', r_hist, (255, 0, 0)),
                                      ('G', g_hist, (0, 255, 0)),
                                      ('B', b_hist, (0, 0, 255))]:
            hist_img = Image.new('RGB', (hist_width, hist_height), (0, 0, 0))
            hist_pixels = hist_img.load()

            # Normalize histogram
            max_val = max(hist) if max(hist) > 0 else 1

            # Draw histogram
            for i in range(256):
                bar_height = int((hist[i] / max_val) * (hist_height - 10))
                x = int((i / 256) * hist_width)
                x_end = int(((i + 1) / 256) * hist_width)

                for y in range(hist_height - bar_height, hist_height):
                    for px in range(x, x_end):
                        if px < hist_width:
                            hist_pixels[px, y] = color

            # Save histogram
            filename = f'histogram_{channel}.png'
            hist_img.save(os.path.join(output_dir, filename))
            results['histograms'][channel] = filename

    def _create_palette_image(self, dominant_colors, output_dir):
        """Create visual color palette"""
        if not dominant_colors:
            return

        palette_width = 500
        palette_height = 100

        palette_img = Image.new('RGB', (palette_width, palette_height))
        pixels = palette_img.load()

        colors_to_show = min(10, len(dominant_colors))
        color_width = palette_width // colors_to_show

        for i, color_info in enumerate(dominant_colors[:colors_to_show]):
            color = color_info['rgb']
            x_start = i * color_width
            x_end = (i + 1) * color_width

            for y in range(palette_height):
                for x in range(x_start, min(x_end, palette_width)):
                    pixels[x, y] = color

        palette_img.save(os.path.join(output_dir, 'color_palette.png'))
