# StegMage - Deployment Guide

## Security Configuration

### 1. Generate Strong Credentials

Before deploying, generate strong credentials:

```bash
# Generate SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"

# Generate AUTH_PASSWORD_HASH from your password
echo -n "your-strong-password" | shasum -a 256
```

### 2. Environment Variables for CapRover

Set these environment variables in CapRover:

**Required:**
- `SECRET_KEY` - Your generated secret key
- `AUTH_PASSWORD` - Your strong password (plain text, will be hashed)
  OR
- `AUTH_PASSWORD_HASH` - Pre-hashed password (SHA256) for extra security

**Security (Production):**
- `FORCE_HTTPS=true` - Enforce HTTPS redirects
- `ALLOWED_ORIGINS=https://yourdomain.com` - Restrict CORS origins

**Optional:**
- `DEBUG=false` - Never enable in production
- `PORT=8080` - Server port (default: 8080)
- `REDIS_URL=redis://redis:6379/0` - Redis connection

### 3. CapRover Deployment

#### Option A: Using Captain Definition

1. Create a `captain-definition` file:
```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

2. Push to CapRover:
```bash
# Install CapRover CLI
npm install -g caprover

# Deploy
caprover deploy
```

#### Option B: Using Docker Compose

CapRover supports docker-compose. Just push your repository and it will auto-detect.

### 4. Security Checklist

- [ ] Set `SECRET_KEY` to a strong random value
- [ ] Set `AUTH_PASSWORD` or `AUTH_PASSWORD_HASH`
- [ ] Enable `FORCE_HTTPS=true`
- [ ] Set `ALLOWED_ORIGINS` to your domain
- [ ] Ensure `DEBUG=false`
- [ ] Use strong password (12+ chars, mixed case, numbers, symbols)
- [ ] Enable HTTPS on CapRover (Let's Encrypt)
- [ ] Configure firewall if needed
- [ ] Regular backups of results/uploads volumes

### 5. Security Features

This deployment includes:

✅ **Password Authentication** - Single password protection (no database needed)
✅ **Session Management** - 24-hour session timeout
✅ **HTTPS Enforcement** - Automatic redirect from HTTP to HTTPS
✅ **Security Headers** - CSP, X-Frame-Options, HSTS, etc.
✅ **CORS Protection** - Configurable allowed origins
✅ **Input Validation** - File type and size restrictions
✅ **Rate Limiting** - Via Flask session management
✅ **No Database** - Stateless authentication using sessions

### 6. Accessing the Application

After deployment:
1. Navigate to `https://yourdomain.com`
2. You'll be redirected to `/login`
3. Enter your password (from `AUTH_PASSWORD`)
4. Session lasts 24 hours

### 7. Managing Sessions

Logout: Click "Logout" button in header or visit `/logout`

### 8. Password Change

To change password:
1. Update `AUTH_PASSWORD` or `AUTH_PASSWORD_HASH` in CapRover
2. Restart the application
3. All users will need to login again

### 9. Monitoring

Check application health:
```bash
curl https://yourdomain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "redis": "connected",
  "app": "running"
}
```

### 10. Troubleshooting

**Can't login:**
- Check `AUTH_PASSWORD` or `AUTH_PASSWORD_HASH` is set correctly
- Clear browser cookies
- Check application logs in CapRover

**HTTPS not working:**
- Ensure `FORCE_HTTPS=true` is set
- Enable HTTPS in CapRover settings
- Check Let's Encrypt certificate

**Redis connection issues:**
- Verify Redis service is running
- Check `REDIS_URL` is correct
- Review worker logs

## Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use strong passwords** - 16+ characters recommended
3. **Enable HTTPS** - Always in production
4. **Regular updates** - Keep Docker images updated
5. **Monitor logs** - Check for suspicious activity
6. **Backup data** - Regular backups of uploads/results
7. **Restrict access** - Use firewall rules if needed
8. **Session timeout** - Default 24h, adjust if needed

## Production Environment Variables Example

```bash
# CapRover Environment Variables
SECRET_KEY=a1b2c3d4e5f6...  # 64-char hex
AUTH_PASSWORD_HASH=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
FORCE_HTTPS=true
ALLOWED_ORIGINS=https://stegmage.yourdomain.com
DEBUG=false
PORT=8080
REDIS_URL=redis://srv-captain--stegmage-redis:6379/0
```

## Support

For issues or questions:
- Review application logs in CapRover
- Check Redis connectivity
- Verify environment variables
- Contact: NetMeSafe
