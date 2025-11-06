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

# Redis connection - lazy initialization
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
redis_conn = None
task_queue = None

def get_redis_connection():
    """Get or create Redis connection"""
    global redis_conn, task_queue
    if redis_conn is None:
        try:
            redis_conn = redis.from_url(redis_url, socket_connect_timeout=5)
            redis_conn.ping()
            task_queue = Queue('stegmage', connection=redis_conn)
        except Exception as e:
            print(f"Warning: Could not connect to Redis: {e}")
            redis_conn = None
            task_queue = None
    return redis_conn, task_queue

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

    # Check Redis connection
    redis_conn, task_queue = get_redis_connection()
    if task_queue is None:
        return jsonify({'error': 'Job queue unavailable. Please check Redis connection.'}), 503

    # Generate unique ID for this analysis
    analysis_id = str(uuid.uuid4())

    # Save uploaded file
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{analysis_id}_{filename}")
    file.save(filepath)

    # Get custom passwords for steghide
    steghide_passwords = None
    if 'steghide_passwords' in request.form:
        try:
            import json
            steghide_passwords = json.loads(request.form['steghide_passwords'])
        except:
            pass

    # Queue analysis job
    try:
        job = task_queue.enqueue(
            'workers.analyze_image',
            filepath,
            analysis_id,
            steghide_passwords,
            job_timeout='10m'
        )

        return jsonify({
            'analysis_id': analysis_id,
            'job_id': job.id,
            'filename': filename,
            'status': 'queued'
        })
    except Exception as e:
        return jsonify({'error': f'Failed to queue job: {str(e)}'}), 500


@app.route('/api/status/<analysis_id>', methods=['GET'])
def check_status(analysis_id):
    """Check analysis status"""
    redis_conn, _ = get_redis_connection()
    if redis_conn is None:
        return jsonify({'error': 'Redis unavailable'}), 503

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


@app.route('/api/image/<analysis_id>', methods=['GET'])
def serve_image(analysis_id):
    """Serve the uploaded image for reverse image search"""
    # Find the uploaded image file
    upload_dir = app.config['UPLOAD_FOLDER']

    # Look for files starting with analysis_id
    for filename in os.listdir(upload_dir):
        if filename.startswith(analysis_id):
            filepath = os.path.join(upload_dir, filename)
            return send_file(filepath, mimetype='image/jpeg')

    return jsonify({'error': 'Image not found'}), 404


@app.route('/api/download-image/<analysis_id>', methods=['GET'])
def download_image(analysis_id):
    """Download the uploaded image"""
    upload_dir = app.config['UPLOAD_FOLDER']

    # Look for files starting with analysis_id
    for filename in os.listdir(upload_dir):
        if filename.startswith(analysis_id):
            filepath = os.path.join(upload_dir, filename)
            # Get original extension
            ext = os.path.splitext(filename)[1] or '.jpg'
            return send_file(filepath, as_attachment=True, download_name=f'stegmage_image{ext}')

    return jsonify({'error': 'Image not found'}), 404


@app.route('/api/reverse-search/<analysis_id>', methods=['GET'])
def get_reverse_search_urls(analysis_id):
    """Generate reverse image search URLs for various search engines"""
    # Note: Local URLs don't work with reverse search engines
    # We provide upload page URLs instead

    search_urls = {
        'google': {
            'name': 'Google Images',
            'url': 'https://images.google.com/imghp',
            'upload_url': 'https://lens.google.com/uploadbyurl',
            'icon': '<i class="fab fa-google"></i>',
            'color': '#4285f4',
            'instructions': 'Click the camera icon, then upload your downloaded image'
        },
        'yandex': {
            'name': 'Yandex',
            'url': 'https://yandex.com/images/search?rpt=imageview',
            'icon': '<i class="fab fa-yandex"></i>',
            'color': '#fc3f1d',
            'instructions': 'Click the camera icon, then upload your downloaded image'
        },
        'bing': {
            'name': 'Bing Images',
            'url': 'https://www.bing.com/images/search?view=detailv2&iss=sbi&form=SBIIDP',
            'icon': '<i class="fab fa-microsoft"></i>',
            'color': '#008373',
            'instructions': 'Click "Browse" to upload your downloaded image'
        },
        'tineye': {
            'name': 'TinEye',
            'url': 'https://tineye.com/',
            'icon': '<i class="fas fa-eye"></i>',
            'color': '#d81159',
            'instructions': 'Click the upload arrow, then select your downloaded image'
        },
        'sogou': {
            'name': 'Sogou',
            'url': 'https://pic.sogou.com/',
            'icon': '<i class="fas fa-search"></i>',
            'color': '#fb6d3a',
            'instructions': 'Click the camera icon, then upload your downloaded image'
        }
    }

    return jsonify({
        'download_url': f'/api/download-image/{analysis_id}',
        'search_engines': search_urls,
        'note': 'Local images cannot be accessed by online search engines. Download the image first, then upload it to your preferred search engine.'
    })


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    redis_conn, _ = get_redis_connection()

    redis_status = 'disconnected'
    if redis_conn is not None:
        try:
            redis_conn.ping()
            redis_status = 'connected'
        except Exception:
            redis_status = 'error'

    return jsonify({
        'status': 'healthy',
        'redis': redis_status,
        'app': 'running'
    })


if __name__ == '__main__':
    # Development server
    # Default port 8080 (macOS uses 5000 for AirPlay)
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 8080)),
        debug=os.environ.get('DEBUG', 'False').lower() == 'true'
    )
