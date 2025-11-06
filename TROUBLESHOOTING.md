# StegMage Troubleshooting Guide

## Common Issues and Solutions

### 403 Forbidden Error

If you get a 403 Forbidden error when accessing http://localhost:5000/, this is typically caused by:

#### 1. Redis Connection Issues

**Symptom:** The web container can't connect to Redis on startup.

**Solution:**
```bash
# Check if all containers are running
docker compose ps

# Check Redis is running
docker compose logs redis

# Restart all services
docker compose down
docker compose up -d

# Check web container logs
docker compose logs web
```

#### 2. Container Health Issues

**Check container status:**
```bash
docker compose ps
```

All containers should show "Up" status. If any are unhealthy:
```bash
# View logs for the unhealthy container
docker compose logs [service-name]

# Restart the service
docker compose restart [service-name]
```

#### 3. Port Conflicts

**Symptom:** Port 5000 or 6379 is already in use.

**Solution:**
```bash
# Check what's using the ports
lsof -i :5000
lsof -i :6379

# Kill the process or change ports in docker-compose.yml
# For example, change "5000:5000" to "5001:5000"
```

### Diagnostic Tool

Run the diagnostic script to check your setup:
```bash
# Inside the container
docker compose exec web python diagnose.py

# Or locally if you have Python
python diagnose.py
```

### Accessing Logs

```bash
# All logs
docker compose logs

# Specific service
docker compose logs web
docker compose logs worker
docker compose logs redis

# Follow logs (real-time)
docker compose logs -f web
```

### Permission Issues

If you get permission errors with uploads or results:

```bash
# Fix permissions on host
chmod 777 uploads results

# Or rebuild with proper permissions
docker compose down
sudo rm -rf uploads results
mkdir uploads results
docker compose up -d
```

### Worker Not Processing Jobs

**Check worker status:**
```bash
# View worker logs
docker compose logs worker

# Restart workers
docker compose restart worker
```

### Redis Connection Refused

**Solution:**
```bash
# Ensure Redis is running
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli ping
# Should return: PONG

# Restart Redis
docker compose restart redis
```

### Rebuilding from Scratch

If nothing else works:
```bash
# Stop and remove everything
docker compose down -v

# Remove images
docker compose rm -f
docker rmi stegmage-web stegmage-worker

# Rebuild and start
docker compose up -d --build

# Check logs
docker compose logs -f
```

## Health Check Endpoint

Access the health check endpoint to verify services:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "redis": "connected",
  "app": "running"
}
```

## Environment Variables

Check your `.env` file or environment variables:

```bash
# View current environment in container
docker compose exec web env | grep -E 'REDIS|DEBUG|SECRET'
```

Required variables:
- `REDIS_URL`: Redis connection URL (default: redis://redis:6379/0)
- `SECRET_KEY`: Flask secret key
- `DEBUG`: Enable debug mode (False in production)

## Getting Help

If you're still experiencing issues:

1. Check the logs: `docker compose logs`
2. Run diagnostics: `python diagnose.py`
3. Check Docker status: `docker compose ps`
4. Verify Redis: `docker compose exec redis redis-cli ping`
5. Open an issue on GitHub with:
   - Error message
   - Container logs
   - Output of `docker compose ps`
   - Output of diagnostic tool

## Performance Issues

### Slow Analysis

If analysis is taking too long:

```bash
# Scale up workers
docker compose up -d --scale worker=4

# Check worker count
docker compose ps | grep worker
```

### Memory Issues

```bash
# Check container memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Recommended: At least 4GB RAM
```

## Development Mode

For development with live reload:

```bash
# Stop production containers
docker compose down

# Run in development mode
export DEBUG=True
python app.py

# In another terminal, start a worker
export REDIS_URL=redis://localhost:6379/0
rq worker stegmage
```
