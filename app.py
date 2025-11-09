#!/usr/bin/env python3
"""
StegMage - Steganography Analysis Platform
Main application entry point
"""

import os
import hashlib
import secrets
import time
import logging
from functools import wraps
from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
import redis
from rq import Queue
import uuid
from pathlib import Path
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['RESULTS_FOLDER'] = 'results'
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

# Authentication configuration
AUTH_PASSWORD_HASH = os.environ.get('AUTH_PASSWORD_HASH', None)
# If no hash is set, generate one from AUTH_PASSWORD (for dev)
if not AUTH_PASSWORD_HASH and os.environ.get('AUTH_PASSWORD'):
    AUTH_PASSWORD_HASH = hashlib.sha256(os.environ.get('AUTH_PASSWORD').encode()).hexdigest()

# CORS configuration - restrict in production
CORS(app, resources={r"/api/*": {"origins": os.environ.get('ALLOWED_ORIGINS', '*').split(',')}})

# Rate Limiting configuration
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
    storage_options={"socket_connect_timeout": 5},
    strategy="fixed-window"
)

# Security logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
security_logger = logging.getLogger('security')

# Brute force protection storage
failed_login_attempts = {}

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


def is_ip_blocked(ip_address):
    """Check if IP is temporarily blocked due to failed login attempts"""
    if ip_address not in failed_login_attempts:
        return False

    attempts, last_attempt = failed_login_attempts[ip_address]

    # Reset after 15 minutes
    if time.time() - last_attempt > 900:
        del failed_login_attempts[ip_address]
        return False

    # Block after 5 failed attempts
    return attempts >= 5


def record_failed_login(ip_address):
    """Record a failed login attempt"""
    if ip_address in failed_login_attempts:
        attempts, _ = failed_login_attempts[ip_address]
        failed_login_attempts[ip_address] = (attempts + 1, time.time())
    else:
        failed_login_attempts[ip_address] = (1, time.time())

    security_logger.warning(f"Failed login attempt from {ip_address}")


def validate_image_file(file_path):
    """Enhanced image file validation"""
    try:
        from PIL import Image
        import magic

        # Check file size (max 50MB)
        if os.path.getsize(file_path) > 50 * 1024 * 1024:
            return False, "File too large (max 50MB)"

        # Check MIME type using python-magic
        mime = magic.from_file(file_path, mime=True)
        allowed_mimes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/tiff']
        if mime not in allowed_mimes:
            return False, f"Invalid file type: {mime}"

        # Verify it's a valid image by opening it
        try:
            with Image.open(file_path) as img:
                img.verify()

            # Re-open to ensure it wasn't corrupted during verify
            with Image.open(file_path) as img:
                img.load()
        except Exception as e:
            return False, f"Invalid or corrupted image: {str(e)}"

        return True, "Valid image"

    except Exception as e:
        return False, f"Validation error: {str(e)}"


def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip auth if no password is configured
        if not AUTH_PASSWORD_HASH:
            return f(*args, **kwargs)

        if not session.get('authenticated'):
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


@app.before_request
def security_headers():
    """Add security headers to all responses"""
    # Force HTTPS in production
    if os.environ.get('FORCE_HTTPS', 'false').lower() == 'true':
        if request.headers.get('X-Forwarded-Proto') == 'http':
            return redirect(request.url.replace('http://', 'https://'), code=301)


@app.after_request
def add_security_headers(response):
    """Add security headers"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # Add CSP header
    csp = "default-src 'self'; " \
          "script-src 'self' 'unsafe-inline'; " \
          "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; " \
          "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; " \
          "img-src 'self' data:; " \
          "connect-src 'self';"
    response.headers['Content-Security-Policy'] = csp

    # HTTPS strict transport security (if enabled)
    if os.environ.get('FORCE_HTTPS', 'false').lower() == 'true':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    return response


@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def login():
    """Login page with brute force protection"""
    # Skip if no password configured
    if not AUTH_PASSWORD_HASH:
        session['authenticated'] = True
        return redirect(url_for('index'))

    # Already logged in
    if session.get('authenticated'):
        return redirect(url_for('index'))

    # Check if IP is blocked
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    if is_ip_blocked(client_ip):
        security_logger.warning(f"Blocked login attempt from {client_ip} (too many failures)")
        return render_template('login.html', error='Too many failed attempts. Please try again in 15 minutes.'), 429

    if request.method == 'POST':
        password = request.form.get('password', '')

        # Add small delay to prevent timing attacks
        time.sleep(0.5)

        password_hash = hashlib.sha256(password.encode()).hexdigest()

        if password_hash == AUTH_PASSWORD_HASH:
            # Clear failed attempts on successful login
            if client_ip in failed_login_attempts:
                del failed_login_attempts[client_ip]

            session['authenticated'] = True
            session.permanent = True

            security_logger.info(f"Successful login from {client_ip}")
            return redirect(url_for('index'))
        else:
            record_failed_login(client_ip)
            attempts_left = 5 - failed_login_attempts[client_ip][0]

            if attempts_left > 0:
                error_msg = f'Invalid password. {attempts_left} attempts remaining.'
            else:
                error_msg = 'Too many failed attempts. Account locked for 15 minutes.'

            return render_template('login.html', error=error_msg)

    return render_template('login.html')


@app.route('/logout')
def logout():
    """Logout"""
    session.clear()
    return redirect(url_for('login'))


@app.route('/')
@login_required
def index():
    """Render main page"""
    return render_template('index.html')


@app.route('/api/upload', methods=['POST'])
@login_required
@limiter.limit("10 per hour")
def upload_file():
    """Handle file upload and queue analysis with enhanced security"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        security_logger.warning(f"Upload rejected: invalid file type {file.filename}")
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

    try:
        file.save(filepath)

        # Enhanced validation
        is_valid, validation_msg = validate_image_file(filepath)
        if not is_valid:
            os.remove(filepath)  # Delete invalid file
            security_logger.warning(f"Upload validation failed: {validation_msg}")
            return jsonify({'error': validation_msg}), 400

        security_logger.info(f"File uploaded successfully: {analysis_id}_{filename}")

    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        security_logger.error(f"Upload failed: {str(e)}")
        return jsonify({'error': 'File upload failed'}), 500

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
@login_required
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


@app.route('/api/results/<analysis_id>', methods=['GET', 'DELETE'])
@login_required
@limiter.limit("30 per minute")
def handle_results(analysis_id):
    """Get or delete analysis results"""
    if request.method == 'GET':
        result_file = os.path.join(app.config['RESULTS_FOLDER'], f"{analysis_id}.json")

        if not os.path.exists(result_file):
            return jsonify({'error': 'Results not found'}), 404

        import json
        with open(result_file, 'r') as f:
            results = json.load(f)

        return jsonify(results)

    elif request.method == 'DELETE':
        import shutil

        # Validate analysis_id format (UUID)
        try:
            uuid.UUID(analysis_id)
        except ValueError:
            return jsonify({'error': 'Invalid analysis ID'}), 400

        deleted_items = []
        errors = []

        # Delete results JSON file
        result_file = os.path.join(app.config['RESULTS_FOLDER'], f"{analysis_id}.json")
        if os.path.exists(result_file):
            try:
                os.remove(result_file)
                deleted_items.append(f"{analysis_id}.json")
            except Exception as e:
                errors.append(f"Failed to delete {analysis_id}.json: {str(e)}")

        # Delete results directory
        result_dir = os.path.join(app.config['RESULTS_FOLDER'], analysis_id)
        if os.path.exists(result_dir):
            try:
                shutil.rmtree(result_dir)
                deleted_items.append(f"{analysis_id}/")
            except Exception as e:
                errors.append(f"Failed to delete {analysis_id}/ directory: {str(e)}")

        # Delete uploaded image file
        upload_dir = app.config['UPLOAD_FOLDER']
        for filename in os.listdir(upload_dir):
            if filename.startswith(analysis_id):
                filepath = os.path.join(upload_dir, filename)
                try:
                    os.remove(filepath)
                    deleted_items.append(f"upload: {filename}")
                except Exception as e:
                    errors.append(f"Failed to delete upload {filename}: {str(e)}")

        # Delete job info from Redis if available
        redis_conn, _ = get_redis_connection()
        if redis_conn is not None:
            job_key = f"stegmage:job:{analysis_id}"
            try:
                redis_conn.delete(job_key)
                deleted_items.append("Redis job data")
            except Exception as e:
                errors.append(f"Failed to delete Redis data: {str(e)}")

        if not deleted_items and not errors:
            return jsonify({'error': 'No data found for this analysis ID'}), 404

        response = {
            'success': True,
            'deleted': deleted_items,
            'analysis_id': analysis_id
        }

        if errors:
            response['warnings'] = errors

        return jsonify(response)


@app.route('/api/download/<analysis_id>/<filename>', methods=['GET'])
@login_required
def download_file(analysis_id, filename):
    """Download extracted or generated files"""
    filepath = os.path.join(app.config['RESULTS_FOLDER'], analysis_id, secure_filename(filename))

    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404

    return send_file(filepath, as_attachment=True)


@app.route('/api/image/<analysis_id>', methods=['GET'])
@login_required
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
@login_required
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


@app.route('/api/results', methods=['GET', 'DELETE'])
@login_required
def handle_all_results():
    """List or delete all analysis results"""
    import json
    import shutil
    from datetime import datetime

    if request.method == 'GET':
        # List all results with metadata
        results_list = []
        results_folder = app.config['RESULTS_FOLDER']

        try:
            for filename in os.listdir(results_folder):
                if filename.endswith('.json') and filename != '.gitkeep':
                    analysis_id = filename.replace('.json', '')
                    filepath = os.path.join(results_folder, filename)

                    try:
                        # Get file metadata
                        stat = os.stat(filepath)
                        created_at = datetime.fromtimestamp(stat.st_ctime).isoformat()
                        file_size = stat.st_size

                        # Try to read basic info from results
                        with open(filepath, 'r') as f:
                            data = json.load(f)
                            image_info = data.get('metadata', {}).get('basic_info', {})

                        results_list.append({
                            'analysis_id': analysis_id,
                            'created_at': created_at,
                            'file_size': file_size,
                            'image_format': image_info.get('format', 'Unknown'),
                            'image_size': f"{image_info.get('width', 0)}x{image_info.get('height', 0)}",
                            'has_findings': any(
                                data.get(key, {}).get('found', False)
                                for key in ['steghide', 'outguess', 'zsteg', 'lsb']
                            )
                        })
                    except Exception as e:
                        print(f"Error reading {filename}: {e}")
                        continue

            # Sort by created_at descending (newest first)
            results_list.sort(key=lambda x: x['created_at'], reverse=True)

            return jsonify({
                'success': True,
                'count': len(results_list),
                'results': results_list
            })
        except Exception as e:
            return jsonify({'error': f'Failed to list results: {str(e)}'}), 500

    elif request.method == 'DELETE':
        # Delete all results
        deleted_count = 0
        errors = []
        results_folder = app.config['RESULTS_FOLDER']
        upload_folder = app.config['UPLOAD_FOLDER']

        # Delete all JSON files and directories in results folder
        try:
            for item in os.listdir(results_folder):
                if item == '.gitkeep':
                    continue

                item_path = os.path.join(results_folder, item)
                try:
                    if os.path.isfile(item_path):
                        os.remove(item_path)
                        deleted_count += 1
                    elif os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                        deleted_count += 1
                except Exception as e:
                    errors.append(f"Failed to delete {item}: {str(e)}")
        except Exception as e:
            errors.append(f"Failed to access results folder: {str(e)}")

        # Delete all uploaded files
        try:
            for item in os.listdir(upload_folder):
                if item == '.gitkeep':
                    continue

                item_path = os.path.join(upload_folder, item)
                try:
                    if os.path.isfile(item_path):
                        os.remove(item_path)
                        deleted_count += 1
                except Exception as e:
                    errors.append(f"Failed to delete upload {item}: {str(e)}")
        except Exception as e:
            errors.append(f"Failed to access uploads folder: {str(e)}")

        # Clear all Redis job data
        redis_conn, _ = get_redis_connection()
        if redis_conn is not None:
            try:
                # Delete all keys matching stegmage:job:*
                for key in redis_conn.scan_iter("stegmage:job:*"):
                    redis_conn.delete(key)
            except Exception as e:
                errors.append(f"Failed to clear Redis data: {str(e)}")

        response = {
            'success': True,
            'deleted_count': deleted_count,
            'message': f'Deleted {deleted_count} items'
        }

        if errors:
            response['warnings'] = errors

        return jsonify(response)


@app.route('/api/reverse-search/<analysis_id>', methods=['GET'])
@login_required
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
