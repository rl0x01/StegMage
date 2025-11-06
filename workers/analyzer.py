"""
Main analysis worker
Coordinates all steganography analysis methods
"""

import json
import os
from pathlib import Path
from datetime import datetime
import redis

from analyzers.lsb import LSBAnalyzer
from analyzers.metadata import MetadataAnalyzer
from analyzers.steghide import SteghideAnalyzer
from analyzers.outguess import OutguessAnalyzer
from analyzers.file_carving import FileCarvingAnalyzer
from analyzers.strings import StringsAnalyzer
from analyzers.zsteg import ZstegAnalyzer


def analyze_image(filepath: str, analysis_id: str, steghide_passwords=None):
    """
    Main analysis function that runs all steganography detection methods

    Args:
        filepath: Path to the uploaded image
        analysis_id: Unique identifier for this analysis
        steghide_passwords: Optional list of custom passwords for steghide
    """
    # Connect to Redis
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    redis_conn = redis.from_url(redis_url)

    # Create results directory
    results_dir = Path('results') / analysis_id
    results_dir.mkdir(parents=True, exist_ok=True)

    # Initialize results structure
    results = {
        'analysis_id': analysis_id,
        'filename': Path(filepath).name,
        'timestamp': datetime.utcnow().isoformat(),
        'status': 'processing',
        'results': {}
    }

    # Update status
    update_status(redis_conn, analysis_id, 'processing', 0)

    # List of analyzers
    analyzers = [
        ('lsb', LSBAnalyzer()),
        ('metadata', MetadataAnalyzer()),
        ('strings', StringsAnalyzer()),
        ('zsteg', ZstegAnalyzer()),
        ('steghide', SteghideAnalyzer()),
        ('outguess', OutguessAnalyzer()),
        ('file_carving', FileCarvingAnalyzer()),
    ]

    total_analyzers = len(analyzers)

    # Run each analyzer
    for idx, (name, analyzer) in enumerate(analyzers):
        try:
            print(f"Running {name} analyzer...")

            # Pass custom passwords to steghide analyzer
            if name == 'steghide' and steghide_passwords:
                result = analyzer.analyze(filepath, str(results_dir), custom_passwords=steghide_passwords)
            else:
                result = analyzer.analyze(filepath, str(results_dir))

            results['results'][name] = {
                'success': True,
                'data': result
            }
        except Exception as e:
            print(f"Error in {name} analyzer: {str(e)}")
            results['results'][name] = {
                'success': False,
                'error': str(e)
            }

        # Update progress
        progress = int(((idx + 1) / total_analyzers) * 100)
        update_status(redis_conn, analysis_id, 'processing', progress)

    # Mark as complete
    results['status'] = 'completed'
    update_status(redis_conn, analysis_id, 'completed', 100)

    # Save results to file
    results_file = Path('results') / f"{analysis_id}.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)

    return results


def update_status(redis_conn, analysis_id: str, status: str, progress: int):
    """Update job status in Redis"""
    job_key = f"stegmage:job:{analysis_id}"
    job_data = {
        'status': status,
        'progress': progress,
        'updated_at': datetime.utcnow().isoformat()
    }
    redis_conn.setex(job_key, 3600, json.dumps(job_data))  # Expire after 1 hour
