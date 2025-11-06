#!/usr/bin/env python3
"""
StegMage Diagnostic Tool
Check if all components are working correctly
"""

import sys
import socket


def check_port(host, port, name):
    """Check if a port is accessible"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        if result == 0:
            print(f"✅ {name} ({host}:{port}) is accessible")
            return True
        else:
            print(f"❌ {name} ({host}:{port}) is NOT accessible")
            return False
    except Exception as e:
        print(f"❌ {name} ({host}:{port}) check failed: {e}")
        return False


def check_redis():
    """Check Redis connection"""
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, socket_connect_timeout=2)
        r.ping()
        print("✅ Redis is responding to ping")
        return True
    except ImportError:
        print("❌ redis-py library not installed")
        return False
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False


def check_flask():
    """Check if Flask is importable"""
    try:
        import flask
        print(f"✅ Flask {flask.__version__} is installed")
        return True
    except ImportError:
        print("❌ Flask is not installed")
        return False


def check_directories():
    """Check if required directories exist"""
    import os
    dirs = ['uploads', 'results', 'templates', 'static', 'analyzers', 'workers']
    all_ok = True
    for d in dirs:
        if os.path.isdir(d):
            print(f"✅ Directory '{d}' exists")
        else:
            print(f"❌ Directory '{d}' is missing")
            all_ok = False
    return all_ok


def main():
    """Run all diagnostic checks"""
    print("🔮 StegMage Diagnostic Tool\n")

    print("=" * 50)
    print("Checking Python Dependencies...")
    print("=" * 50)
    check_flask()
    try:
        import PIL
        print(f"✅ Pillow (PIL) is installed")
    except ImportError:
        print("❌ Pillow is not installed")

    print("\n" + "=" * 50)
    print("Checking Network Connectivity...")
    print("=" * 50)
    check_port('localhost', 5000, 'Flask App')
    check_port('localhost', 6379, 'Redis')

    print("\n" + "=" * 50)
    print("Checking Redis...")
    print("=" * 50)
    check_redis()

    print("\n" + "=" * 50)
    print("Checking File System...")
    print("=" * 50)
    check_directories()

    print("\n" + "=" * 50)
    print("Testing HTTP Request to Flask App...")
    print("=" * 50)
    try:
        import urllib.request
        response = urllib.request.urlopen('http://localhost:5000/health', timeout=5)
        data = response.read().decode('utf-8')
        print(f"✅ Flask app responded: {data}")
    except Exception as e:
        print(f"❌ Flask app request failed: {e}")

    print("\n" + "=" * 50)
    print("Diagnostic Complete")
    print("=" * 50)


if __name__ == '__main__':
    main()
