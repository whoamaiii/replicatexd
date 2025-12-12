# Deployment Guide

Production deployment guide for PsyVis Lab.

**Last Updated**: 2025-12-12

---

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Environment Configuration](#environment-configuration)
4. [Production Build](#production-build)
5. [Deployment Options](#deployment-options)
6. [Python Dependencies](#python-dependencies)
7. [Reverse Proxy](#reverse-proxy)
8. [SSL/HTTPS Setup](#sslhttps-setup)
9. [Monitoring & Logging](#monitoring--logging)
10. [Performance Tuning](#performance-tuning)
11. [Security Best Practices](#security-best-practices)
12. [Backup & Recovery](#backup--recovery)

---

## Overview

PsyVis Lab is a monorepo application with:
- **Frontend**: Static React build served by reverse proxy or CDN
- **Backend**: Node.js Express server (port 5174 by default)
- **Optional**: Python worker for structural map generation

---

## System Requirements

### Minimum
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows Server
- **Node.js**: 18.0.0 or higher
- **RAM**: 2GB available
- **Storage**: 10GB (plus space for library output)
- **Network**: Stable internet for OpenRouter API

### Recommended
- **OS**: Ubuntu 22.04 LTS or Debian 12
- **Node.js**: 20.x LTS
- **RAM**: 4GB+ available
- **Storage**: 50GB+ SSD
- **CPU**: 2+ cores

### Optional (for map generation)
- **Python**: 3.9+ with pip
- **Additional RAM**: +2GB for map workers
- **GPU**: Not required (CPU-based map generation)

---

## Environment Configuration

### Required Variables

Create `.env` in project root:

```env
# API Keys (REQUIRED)
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-...  # Optional fallback

# Server Configuration
NODE_ENV=production
PORT=5174
HOST=0.0.0.0  # Listen on all interfaces

# Library Settings
LIBRARY_OUTPUT_DIR=./psyvis_lab_output
LIBRARY_RETENTION_DAYS=7
LIBRARY_TRASH_ENABLED=true
LIBRARY_TRASH_GRACE_HOURS=24

# Maps Configuration (Optional)
MAPS_ENABLED=true
MAPS_CACHE_DIR=./map_cache
MAPS_PYTHON_PATH=/usr/bin/python3
MAPS_MAX_IMAGE_MP=4
MAPS_DEPTH_ENABLED=true
MAPS_NORMALS_ENABLED=true
MAPS_EDGES_ENABLED=true
MAPS_FACE_MASK_ENABLED=true
MAPS_HANDS_MASK_ENABLED=true

# Model Settings (Optional)
OPENAI_MODEL=openai/gpt-4o  # Override default vision model
```

### Security Considerations

**DO NOT commit `.env` to version control**

```bash
# Add to .gitignore
echo ".env" >> .gitignore
```

**Use environment variable management:**
- Docker: Use `-e` flags or `--env-file`
- Kubernetes: Use Secrets
- Cloud platforms: Use built-in secret managers (AWS Secrets Manager, Azure Key Vault, etc.)

---

## Production Build

### Build Process

```bash
# Install dependencies
npm ci --production=false

# Build frontend and backend
npm run build

# Output:
# - dist/ → Frontend static files
# - server/dist/ → Backend compiled JavaScript
```

### Build Artifacts

**Frontend** (`dist/`):
- `index.html` - Entry point
- `assets/*.js` - Bundled JavaScript (code-split)
- `assets/*.css` - Bundled styles
- Static assets

**Backend** (`server/dist/`):
- `index.js` - Express server entry
- `index.js.map` - Source map

---

## Deployment Options

### Option 1: Single VPS/Server (Recommended for Small-Medium Scale)

**Architecture**:
```
[Nginx/Caddy] → Frontend (static files)
              → Backend (Node.js on :5174)
```

**Setup**:

1. **Upload build artifacts**:
   ```bash
   rsync -avz dist/ user@server:/var/www/psyvis-lab/
   rsync -avz server/dist/ user@server:/opt/psyvis-lab/server/
   rsync -avz package.json user@server:/opt/psyvis-lab/
   rsync -avz data/ user@server:/opt/psyvis-lab/data/
   ```

2. **Install production dependencies on server**:
   ```bash
   ssh user@server
   cd /opt/psyvis-lab
   npm ci --production
   ```

3. **Create systemd service** (`/etc/systemd/system/psyvis-lab.service`):
   ```ini
   [Unit]
   Description=PsyVis Lab Backend
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/opt/psyvis-lab
   EnvironmentFile=/opt/psyvis-lab/.env
   ExecStart=/usr/bin/node server/dist/index.js
   Restart=on-failure
   RestartSec=10
   StandardOutput=journal
   StandardError=journal
   SyslogIdentifier=psyvis-lab

   [Install]
   WantedBy=multi-user.target
   ```

4. **Enable and start service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable psyvis-lab
   sudo systemctl start psyvis-lab
   sudo systemctl status psyvis-lab
   ```

---

### Option 2: Docker (Recommended for Containerized Deployments)

**Dockerfile**:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install Python for map generation (optional)
RUN apk add --no-cache python3 py3-pip

# Copy production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/data ./data

# Create directories for library and maps
RUN mkdir -p psyvis_lab_output map_cache

# Expose port
EXPOSE 5174

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5174/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "server/dist/index.js"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  psyvis-lab:
    build: .
    ports:
      - "5174:5174"
    env_file:
      - .env
    volumes:
      - ./psyvis_lab_output:/app/psyvis_lab_output
      - ./map_cache:/app/map_cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5174/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - psyvis-lab
    restart: unless-stopped
```

**Deploy**:
```bash
docker-compose up -d
docker-compose logs -f psyvis-lab
```

---

### Option 3: Cloud Platform (AWS, Google Cloud, Azure)

**AWS Elastic Beanstalk**:
1. Create `.ebextensions/nodecommand.config`:
   ```yaml
   option_settings:
     aws:elasticbeanstalk:container:nodejs:
       NodeCommand: "node server/dist/index.js"
   ```

2. Deploy:
   ```bash
   eb init
   eb create psyvis-lab-prod
   eb deploy
   ```

**Google Cloud Run**:
```bash
gcloud run deploy psyvis-lab \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="$(cat .env | xargs)"
```

**Azure Web Apps**:
```bash
az webapp up --name psyvis-lab --runtime "NODE:20-lts"
```

---

## Python Dependencies

### For Map Generation (Optional)

**Install Python packages**:

```bash
pip3 install --upgrade pip
pip3 install Pillow numpy opencv-python mediapipe
```

**Virtual Environment** (recommended):

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install Pillow numpy opencv-python mediapipe
```

**Update `.env`**:
```env
MAPS_PYTHON_PATH=/path/to/venv/bin/python3
```

**Docker with Python**:
Already included in Dockerfile example above.

---

## Reverse Proxy

### Nginx Configuration

**/etc/nginx/sites-available/psyvis-lab**:

```nginx
upstream psyvis_backend {
    server 127.0.0.1:5174;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (static files)
    location / {
        root /var/www/psyvis-lab;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://psyvis_backend;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;

        # Timeouts for long-running operations
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        # Buffer settings for large responses
        proxy_buffering off;
        proxy_request_buffering off;
        client_max_body_size 50M;
    }
}
```

**Enable site**:
```bash
sudo ln -s /etc/nginx/sites-available/psyvis-lab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Caddy Configuration (Simpler Alternative)

**Caddyfile**:

```caddy
your-domain.com {
    # Automatic HTTPS

    # Frontend
    root * /var/www/psyvis-lab
    file_server
    try_files {path} /index.html

    # Backend API
    handle /api/* {
        reverse_proxy localhost:5174 {
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}

            # Timeouts
            transport http {
                read_timeout 300s
                write_timeout 300s
            }
        }
    }

    # Security headers
    header {
        X-Frame-Options SAMEORIGIN
        X-Content-Type-Options nosniff
        X-XSS-Protection "1; mode=block"
    }
}
```

**Run Caddy**:
```bash
caddy run --config Caddyfile
```

---

## SSL/HTTPS Setup

### Let's Encrypt (Free, Recommended)

**With Certbot (Nginx)**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

**Auto-renewal**:
```bash
sudo certbot renew --dry-run
# Adds cron job automatically
```

**With Caddy**:
Automatic! Caddy handles SSL certificate provisioning and renewal.

---

## Monitoring & Logging

### Application Logs

**Systemd Logs** (if using systemd):
```bash
sudo journalctl -u psyvis-lab -f
```

**Docker Logs**:
```bash
docker-compose logs -f psyvis-lab
```

**Log to File**:

Update systemd service:
```ini
StandardOutput=append:/var/log/psyvis-lab/output.log
StandardError=append:/var/log/psyvis-lab/error.log
```

### Health Monitoring

**Endpoint**: `GET /api/health`

Returns `200 OK` if server is healthy.

**Uptime Monitoring Tools**:
- UptimeRobot
- Pingdom
- Better Uptime

**Example check** (every 5 minutes):
```bash
*/5 * * * * curl -f https://your-domain.com/api/health || echo "PsyVis Lab down" | mail -s "Alert" admin@example.com
```

### Performance Monitoring

**PM2 with Monitoring**:
```bash
npm install -g pm2
pm2 start server/dist/index.js --name psyvis-lab
pm2 monit
```

**Application Performance Monitoring (APM)**:
- New Relic
- Datadog
- Sentry (for error tracking)

---

## Performance Tuning

### Node.js Optimization

**Increase memory limit**:
```bash
NODE_OPTIONS="--max-old-space-size=4096" node server/dist/index.js
```

**Use clustering** (for multi-core):

Create `server.cluster.js`:
```javascript
import cluster from 'cluster'
import os from 'os'

const numCPUs = os.cpus().length

if (cluster.isPrimary) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died, respawning...`)
    cluster.fork()
  })
} else {
  import('./server/dist/index.js')
}
```

### Nginx Optimization

**Enable gzip**:
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
```

**Connection pooling**:
```nginx
upstream psyvis_backend {
    server 127.0.0.1:5174;
    keepalive 64;
}
```

### Database/Storage

**Library cleanup automation**:
- Retention policy runs daily
- Adjust `LIBRARY_RETENTION_DAYS` based on storage capacity
- Monitor disk usage: `df -h`

---

## Security Best Practices

### API Key Protection

- **Never expose** `OPENROUTER_API_KEY` or `OPENAI_API_KEY` to frontend
- Use environment variables only
- Rotate keys periodically
- Use separate keys for dev/staging/production

### Rate Limiting

Install `express-rate-limit`:
```javascript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/api/', limiter)
```

### Input Validation

Already implemented with Zod schemas. Ensure all endpoints validate input.

### CORS Configuration

**Production CORS** (`server/src/index.ts`):
```javascript
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}))
```

### Content Security Policy

**Add CSP header** (Nginx):
```nginx
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
```

---

## Backup & Recovery

### Library Data

**Backup script**:
```bash
#!/bin/bash
tar -czf backup-$(date +%Y%m%d).tar.gz psyvis_lab_output/ map_cache/
aws s3 cp backup-$(date +%Y%m%d).tar.gz s3://your-backup-bucket/
```

**Cron job** (daily at 2 AM):
```cron
0 2 * * * /path/to/backup.sh
```

### Database (if using one in future)

No database currently. Library uses filesystem JSON.

### Disaster Recovery

1. **Rebuild from source**:
   ```bash
   git clone <repo>
   npm ci
   npm run build
   ```

2. **Restore environment**:
   ```bash
   cp .env.backup .env
   ```

3. **Restore library data**:
   ```bash
   tar -xzf backup-latest.tar.gz
   ```

4. **Restart services**:
   ```bash
   sudo systemctl restart psyvis-lab
   ```

---

## Troubleshooting

**Port already in use**:
```bash
lsof -i :5174
kill -9 <PID>
```

**Permission denied**:
```bash
sudo chown -R $USER:$USER psyvis_lab_output/ map_cache/
```

**Python maps not working**:
```bash
which python3
python3 -c "import cv2, mediapipe; print('OK')"
```

**Out of memory**:
- Increase server RAM
- Reduce `MAPS_MAX_IMAGE_MP`
- Decrease `LIBRARY_RETENTION_DAYS` to free space

---

## Additional Resources

- [Performance Guide](./PERFORMANCE.md) - Optimization strategies
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [API Reference](./API_REFERENCE.md) - Endpoint documentation

---

**Need help?** Open an issue on [GitHub](https://github.com/your-repo/issues)
