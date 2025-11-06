#!/usr/bin/env python3
"""
StegMage - Steganography Analysis Platform
Main application entry point
"""

import os
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import redis
from rq import Queue
import uuid
from pathlib import Path

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['RESULTS_FOLDER'] = 'results'

# CORS configuration
CORS(app)

# Redis connection
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
redis_conn = redis.from_url(redis_url)
task_queue = Queue('stegmage', connection=redis_conn)

# Ensure directories exist
Path(app.config['UPLOAD_FOLDER']).mkdir(exist_ok=True)
Path(app.config['RESULTS_FOLDER']).mkdir(exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'tif', 'jfif'}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload and queue analysis"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    # Generate unique ID for this analysis
    analysis_id = str(uuid.uuid4())

    # Save uploaded file
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{analysis_id}_{filename}")
    file.save(filepath)

    # Queue analysis job
    job = task_queue.enqueue(
        'workers.analyze_image',
        filepath,
        analysis_id,
        job_timeout='10m'
    )

    return jsonify({
        'analysis_id': analysis_id,
        'job_id': job.id,
        'filename': filename,
        'status': 'queued'
    })


@app.route('/api/status/<analysis_id>', methods=['GET'])
def check_status(analysis_id):
    """Check analysis status"""
    # Get job from Redis
    job_key = f"stegmage:job:{analysis_id}"
    job_data = redis_conn.get(job_key)

    if not job_data:
        return jsonify({'error': 'Analysis not found'}), 404

    import json
    job_info = json.loads(job_data)

    return jsonify(job_info)


@app.route('/api/results/<analysis_id>', methods=['GET'])
def get_results(analysis_id):
    """Get analysis results"""
    result_file = os.path.join(app.config['RESULTS_FOLDER'], f"{analysis_id}.json")

    if not os.path.exists(result_file):
        return jsonify({'error': 'Results not found'}), 404

    import json
    with open(result_file, 'r') as f:
        results = json.load(f)

    return jsonify(results)


@app.route('/api/download/<analysis_id>/<filename>', methods=['GET'])
def download_file(analysis_id, filename):
    """Download extracted or generated files"""
    filepath = os.path.join(app.config['RESULTS_FOLDER'], analysis_id, secure_filename(filename))

    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404

    return send_file(filepath, as_attachment=True)


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        redis_conn.ping()
        return jsonify({'status': 'healthy', 'redis': 'connected'})
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 503


if __name__ == '__main__':
    # Development server
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=os.environ.get('DEBUG', 'False').lower() == 'true'
    )
