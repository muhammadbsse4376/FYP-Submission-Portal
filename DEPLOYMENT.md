# FYP Portal - Complete Deployment Guide (Oracle Cloud + GitHub Pack)

> **Target Cost:** $0/year (Everything is free or via student pack)  
> **Uptime:** 99.9% with Oracle Cloud Always Free  
> **Setup Time:** ~45 minutes

---

## 🏗️ Architecture Overview

```
Frontend: Vercel (Already deployed)
    ↓ HTTPS
Domain: yourdomain.me (GitHub Pack/Namecheap)
    ↓ HTTPS + Cloudflare CDN (GitHub Pack)
Backend: Oracle Cloud Compute Instance
    ├── Docker Container (Flask + Gunicorn)
    ├── Nginx Reverse Proxy + SSL
    └── PostgreSQL Database (Always Free)
```

---

# 📋 Prerequisites

## 1. Create Oracle Cloud Account (Always Free - No Auto Charges)

Visit: https://www.oracle.com/cloud/free/

- Sign up (requires credit card for verification, but **NO charges ever**)
- Verify email
- Access Oracle Cloud Console

## 2. Tools Installed Locally

- Git: https://git-scm.com/
- Docker Desktop: https://www.docker.com/products/docker-desktop/
- SSH client (built into Windows 10+, macOS, Linux)

---

# 🚀 Step 1: Create Oracle Cloud Infrastructure

## 1.1 Create Compute Instance

**In Oracle Cloud Console:**

1. **Navigate:** Compute → Instances
2. **Click:** Create Instance
3. **Configure:**
   ```
   Name: fyp-backend
   Image: Ubuntu 22.04 (Always Free eligible)
   Shape: Ampere (ARM) - free tier
   OCPU: 4 (free)
   Memory: 24GB (free)
   Storage: 50GB (free)
   VCN: Create new (name: fyp-vcn)
   Subnet: Create new
   Assign Public IP: YES ✓
   SSH Key: Generate new keypair → SAVE file as "fyp-key.key"
   ```
4. **Click:** Create Instance
5. **Wait:** ~1-2 minutes for provisioning
6. **Save:** Note the **Public IP Address** (e.g., 140.238.x.x)

## 1.2 Configure Network Security

**In Oracle Cloud Console:**

1. **Navigate:** Networking → Virtual Cloud Networks → fyp-vcn
2. **Select:** Security Lists → Default Security List
3. **Add Ingress Rules:**

   a) **HTTP (Port 80)**
   ```
   Stateless: [  ] (unchecked)
   IP Protocol: TCP
   Source: 0.0.0.0/0
   TCP Destination Port: 80
   ```

   b) **HTTPS (Port 443)**
   ```
   Stateless: [  ] (unchecked)
   IP Protocol: TCP
   Source: 0.0.0.0/0
   TCP Destination Port: 443
   ```

   c) **SSH (Port 22)**
   ```
   Stateless: [  ] (unchecked)
   IP Protocol: TCP
   Source: 0.0.0.0/0
   TCP Destination Port: 22
   ```

## 1.3 Create PostgreSQL Database

**Option A: Autonomous Database (Easiest)**

1. **In Console:** Oracle Database → Autonomous Database
2. **Create Autonomous Database:**
   ```
   Workload Type: Transaction Processing
   Deployment Type: Shared Infrastructure
   Database Name: fyp_db
   Admin Password: YourSecurePassword123! (save this!)
   License Type: Always Free ✓
   ```
3. **Click:** Create (~5 minutes)
4. **After creation:** Download **Wallet** (save securely)
5. **In SQL Developer Web:**
   ```sql
   CREATE USER flask_user IDENTIFIED BY "SecurePassword123!";
   GRANT CONNECT, RESOURCE, DBA TO flask_user;
   ALTER USER flask_user QUOTA UNLIMITED ON USERS;
   ```

**Get Connection String:**
- In Autonomous Database page → **Database Connection**
- Copy the JDBC connection string, format as:
  ```
  postgresql://flask_user:SecurePassword123!@host:5432/fyp_db
  ```

---

# 📦 Step 2: Prepare Backend Code

## 2.1 Create Production Environment File

**Create `fyp/Backend/.env.production`:**

```bash
FLASK_ENV=production
SECRET_KEY=generate_32_char_random_string_here
JWT_SECRET_KEY=generate_32_char_random_string_for_jwt
DATABASE_URL=postgresql://flask_user:SecurePassword123!@your-host:5432/fyp_db
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_DEFAULT_SENDER=your-gmail@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

**Generate secure random strings:**
```powershell
# In PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

## 2.2 Update config.py

**In `Backend/config.py`** - ensure this exists:

```python
import os
from datetime import timedelta

class ProductionConfig:
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
```

---

# 🐳 Step 3: Deploy to Oracle Cloud

## 3.1 SSH into Your Instance

**On Windows (PowerShell):**

```powershell
# Make SSH key readable
icacls fyp-key.key /inheritance:r /grant:r "$env:USERNAME`:`(F`)"

# SSH in
ssh -i fyp-key.key ubuntu@YOUR_PUBLIC_IP_HERE

# Example:
# ssh -i fyp-key.key ubuntu@140.238.123.45
```

## 3.2 Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Exit and reconnect SSH
exit

# Reconnect with new permissions
ssh -i fyp-key.key ubuntu@YOUR_PUBLIC_IP_HERE

# Verify
docker --version
```

## 3.3 Clone & Setup Repository

```bash
# Clone your repo
git clone https://github.com/muhammadbsse4376/FYP-Submission-Portal.git
cd FYP-Submission-Portal/fyp

# Create required directories
mkdir -p Backend/uploads
mkdir -p ssl
```

## 3.4 Create docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: fyp_postgres
    environment:
      POSTGRES_USER: fyp_user
      POSTGRES_PASSWORD: YourSecurePassword123!
      POSTGRES_DB: fyp_portal
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fyp_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile
    container_name: fyp_backend
    environment:
      FLASK_ENV: production
      SECRET_KEY: ${SECRET_KEY}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      DATABASE_URL: postgresql://fyp_user:YourSecurePassword123!@postgres:5432/fyp_portal
      MAIL_USERNAME: ${MAIL_USERNAME}
      MAIL_PASSWORD: ${MAIL_PASSWORD}
      MAIL_DEFAULT_SENDER: ${MAIL_DEFAULT_SENDER}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./Backend/uploads:/app/uploads
    restart: always

  nginx:
    image: nginx:alpine
    container_name: fyp_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./Backend/uploads:/app/uploads:ro
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
EOF
```

## 3.5 Create Nginx Configuration

```bash
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 100M;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 120s;
        }

        location /uploads {
            alias /app/uploads;
            expires 30d;
        }
    }
}
EOF
```

## 3.6 Create .env File

```bash
cat > .env << 'EOF'
SECRET_KEY=your_32_char_random_string_here
JWT_SECRET_KEY=another_32_char_random_string_here
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-app-specific-password
MAIL_DEFAULT_SENDER=your-gmail@gmail.com
EOF
```

## 3.7 Start Services

```bash
# Start all containers
docker-compose up -d

# Check if running
docker-compose ps

# View backend logs
docker-compose logs -f backend

# Test API (should see "Connection refused" at first, wait 30 seconds)
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status": "healthy", "service": "FYP Portal Backend"}
```

---

# 🌐 Step 4: Setup Domain & SSL

## 4.1 Get Free Domain from GitHub Pack

1. Go to https://education.github.com/pack
2. Find **Namecheap** offer
3. Click **Get for free** → Redeem
4. Claim your free `.me` domain (e.g., `api-fyp.me`)

## 4.2 Setup Cloudflare (Also Free from GitHub Pack)

1. Go to https://education.github.com/pack
2. Find **Cloudflare** offer
3. Click **Redeem** (get free tier + education benefits)

### In Cloudflare:

1. **Add Site** → Enter your domain name
2. **Free Plan**
3. **Update Namecheap nameservers** to Cloudflare nameservers (copy from Cloudflare)
4. **Add DNS Record:**
   ```
   Type: A
   Name: api
   IPv4: YOUR_ORACLE_PUBLIC_IP
   Proxy: Proxied ✓
   ```
5. **SSL/TLS → Full (Strict)**
6. **SSL/TLS → Edge Certificates → Enable HSTS**

## 4.3 Generate SSL Certificate

```bash
# Install Certbot
sudo apt install certbot -y

# Generate certificate
sudo certbot certonly --standalone -d api.yourdomain.me

# When prompted: Enter your email, agree to terms

# Copy to ssl folder
sudo cp /etc/letsencrypt/live/api.yourdomain.me/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/api.yourdomain.me/privkey.pem ./ssl/key.pem
sudo chown ubuntu:ubuntu ./ssl/*
```

## 4.4 Update Nginx for HTTPS

```bash
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        client_max_body_size 100M;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 120s;
        }

        location /uploads {
            alias /app/uploads;
            expires 30d;
            add_header Cache-Control "public, max-age=2592000";
        }
    }
}
EOF

# Restart Nginx
docker-compose restart nginx

# Test SSL
curl https://api.yourdomain.me/health
```

## 4.5 Auto-Renew SSL Certificates

```bash
# Add to crontab (renewal + restart)
sudo crontab -e

# Add this line (runs daily at 3 AM):
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/api.yourdomain.me/fullchain.pem /home/ubuntu/FYP-Submission-Portal/fyp/ssl/cert.pem && cp /etc/letsencrypt/live/api.yourdomain.me/privkey.pem /home/ubuntu/FYP-Submission-Portal/fyp/ssl/key.pem && cd /home/ubuntu/FYP-Submission-Portal/fyp && docker-compose restart nginx
```

---

# 🔗 Step 5: Connect Frontend to Backend

## 5.1 Update Backend CORS

**In `Backend/config.py`:**

```python
CORS_ORIGINS = [
    'https://yourdomain.vercel.app',
    'https://yourdomain.me',
    'http://localhost:3000',  # Local dev
]
```

## 5.2 Update Frontend .env

**In Vercel Dashboard:**

1. Settings → Environment Variables
2. Add:
   ```
   VITE_API_BASE_URL=https://api.yourdomain.me
   ```
3. Redeploy frontend

**Or locally in `.env.production`:**
```
VITE_API_BASE_URL=https://api.yourdomain.me
```

## 5.3 Test Connection

```bash
# From frontend
fetch('https://api.yourdomain.me/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

---

# 📊 Cost Summary

| Service | Year 1 | Year 2+ |
|---------|--------|---------|
| Oracle Compute | **$0** | **$0** (Always Free) |
| PostgreSQL | **$0** | **$0** (Always Free) |
| Object Storage | **$0** | **$0** (Always Free) |
| Domain (.me) | **$0** | ~$8-12/year |
| Cloudflare CDN | **$0** | **$0** (Free tier) |
| SSL Cert | **$0** | **$0** (Let's Encrypt) |
| **TOTAL** | **$0** | **~$10/year** |

**🎉 Full production stack completely FREE for first year!**

---

# ✅ Verification Checklist

- [ ] Oracle Cloud instance running (`docker ps`)
- [ ] SSH access working
- [ ] Backend API responding: `curl https://api.yourdomain.me/health`
- [ ] Database connected (check logs: `docker-compose logs postgres`)
- [ ] Nginx reverse proxy working
- [ ] SSL certificate valid: `openssl s_client -connect api.yourdomain.me:443`
- [ ] Frontend calling backend correctly
- [ ] Domain nameservers updated in Namecheap
- [ ] Cloudflare DNS records added
- [ ] SSL certificate auto-renewal scheduled

---

# 🆘 Troubleshooting

### Backend not responding
```bash
docker-compose logs backend
docker-compose restart backend
```

### Database connection failed
```bash
docker-compose logs postgres
# Check DATABASE_URL format in .env
```

### SSL certificate issues
```bash
sudo certbot certificates  # Check validity
curl https://api.yourdomain.me  # Test
```

### Domain not resolving
```bash
# Check Cloudflare DNS propagation
# Use: https://dns.google or https://www.whatsmydns.net
nslookup api.yourdomain.me
```

---

# 🔒 Security Best Practices

1. **Regular backups:**
   ```bash
   docker-compose exec postgres pg_dump -U fyp_user fyp_portal | gzip > backup_$(date +%Y%m%d).sql.gz
   ```

2. **Update system weekly:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker-compose pull && docker-compose up -d
   ```

3. **Monitor resources:**
   ```bash
   docker stats
   ```

4. **Setup Oracle monitoring alerts** in Cloud Console

---

# 📞 Support & Resources

- Oracle Cloud Always Free: https://www.oracle.com/cloud/free/faq/
- Let's Encrypt: https://letsencrypt.org/docs/
- Cloudflare Docs: https://developers.cloudflare.com/
- Docker: https://docs.docker.com/
- Flask Docker: https://flask.palletsprojects.com/en/latest/deploying/

---

**Status:** ✅ Ready for Production  
**Last Updated:** April 2026  
**Cost:** $0/year (Always Free)
