"""
Base analyzer class
All analyzers should inherit from this class
"""

from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseAnalyzer(ABC):
    """Base class for all steganography analyzers"""

    @abstractmethod
    def analyze(self, filepath: str, output_dir: str) -> Dict[str, Any]:
        """
        Analyze an image file

        Args:
            filepath: Path to the image file
            output_dir: Directory to save output files

        Returns:
            Dictionary containing analysis results
        """
        pass

    def is_available(self) -> bool:
        """
        Check if the analyzer is available (tools installed, etc.)

        Returns:
            True if analyzer can run, False otherwise
        """
        return True
