# FYP Portal Backend - Fly.io Deployment Guide

## Overview
This guide covers deploying your Flask backend to Fly.io (free tier) and connecting your domain from the GitHub Student Developer Pack.

---

## Prerequisites

1. **Fly.io Account** (Free tier)
   - Sign up at https://fly.io
   - Install Fly.io CLI: https://fly.io/docs/getting-started/installing-flyctl/
   
2. **Database** (PostgreSQL recommended for free tier)
   - Free PostgreSQL options:
     - **Render** (free tier: 90 days free, then paid)
     - **Supabase** (free tier with 500MB storage)
     - **Railway** (free tier with credits)
     - **ElephantSQL** (free tier removed, use alternatives)

3. **GitHub Student Developer Pack**
   - Domain name from Namecheap (.me domain free for 1 year)

---

## Step 1: Set Up PostgreSQL Database

### Option A: Supabase (Recommended - Easiest)
1. Go to https://supabase.com
2. Sign up with GitHub
3. Create a new project
4. Go to **Settings → Database** → copy the connection string
5. Format: `postgresql://username:password@host:port/database_name`

### Option B: Render
1. Go to https://render.com
2. Create free PostgreSQL instance
3. Copy connection string from dashboard

### Option C: Railway
1. Go to https://railway.app
2. Create PostgreSQL database
3. Copy DATABASE_URL from variables

---

## Step 2: Prepare Your Local Repository

### 2.1 Update Backend Requirements
```bash
# Copy fixed requirements to main requirements.txt
cd fyp/Backend
copy requirements_fixed.txt requirements.txt
# Or on Mac/Linux:
# cp requirements_fixed.txt requirements.txt
```

### 2.2 Add Gunicorn (Production Server)
```bash
pip install gunicorn
```

### 2.3 Create .env File (Local Only - DO NOT COMMIT)
```bash
# Copy .env.example to .env
copy .env.example .env
# Edit .env with your values:
```

Edit `.env`:
```
SECRET_KEY=your_very_secure_random_string
JWT_SECRET_KEY=your_jwt_very_secure_random_string
FLASK_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

**⚠️ IMPORTANT: Add `.env` to `.gitignore` - NEVER commit secrets!**

---

## Step 3: Deploy to Fly.io

### 3.1 Install Fly CLI
```bash
# Windows (PowerShell as Admin)
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

### 3.2 Login to Fly
```bash
flyctl auth login
# Opens browser to authenticate
```

### 3.3 Launch on Fly
```bash
# From fyp/Backend directory
cd fyp/Backend

# Create Fly app
flyctl launch

# Follow prompts:
# - App name: fyp-portal-backend (or your choice)
# - Region: lax (Los Angeles) - adjust as needed
# - Postgres database: No (we're using external DB)
# - Deploy now: No (we'll set secrets first)
```

### 3.4 Set Environment Secrets
```bash
# Set all secrets from your .env file
flyctl secrets set SECRET_KEY="your_secret_key"
flyctl secrets set JWT_SECRET_KEY="your_jwt_secret_key"
flyctl secrets set DATABASE_URL="postgresql://..."
flyctl secrets set MAIL_USERNAME="your-email@gmail.com"
flyctl secrets set MAIL_PASSWORD="your_app_password"
flyctl secrets set MAIL_DEFAULT_SENDER="your-email@gmail.com"
flyctl secrets set FLASK_ENV="production"

# Verify secrets are set
flyctl secrets list
```

### 3.5 Deploy
```bash
# Deploy your app
flyctl deploy

# Monitor deployment
flyctl logs

# Check app status
flyctl status
```

### 3.6 Verify Deployment
```bash
# Get your app URL
flyctl info

# Test health endpoint
curl https://fyp-portal-backend.fly.dev/health

# Expected response: {"status": "healthy", "service": "FYP Portal Backend"}
```

---

## Step 4: Connect Your Custom Domain

### 4.1 Get Domain from GitHub Student Developer Pack

1. Visit https://education.github.com/pack
2. Scroll to **Namecheap** offer
3. Click "Get for free" or "Redeem"
4. Use code: You'll get a free .me domain for 1 year
5. Claim your domain (e.g., `yourdomain.me`)

### 4.2 Point Domain to Fly.io

#### Option A: Using Namecheap nameservers (Recommended)
```bash
# Get Fly nameservers
flyctl domains create-certificate yourdomain.me
# Follow the output instructions

# In Namecheap dashboard:
# 1. Go to Domain List
# 2. Manage yourdomain.me
# 3. Nameservers → Custom DNS
# 4. Add Fly nameservers:
#    - ns-1.fly.dev
#    - ns-2.fly.dev
```

#### Option B: Using CNAME record (Faster)
```bash
# In Namecheap dashboard:
# 1. Advanced DNS
# 2. Add CNAME record:
#    - Host: @
#    - Value: yourdomain.me.fly.dev
#    - TTL: 30 min
```

### 4.3 Configure Fly to Use Your Domain
```bash
# Add custom domain to Fly app
flyctl certs create yourdomain.me

# Verify it's working
flyctl certs list

# Wait a few minutes for DNS propagation
# Test: curl https://yourdomain.me/health
```

---

## Step 5: Update Frontend API Calls

In your Vercel frontend, update the API base URL:

**Update [src/utils/api.js](src/utils/api.js):**
```javascript
const API_URL = process.env.REACT_APP_API_URL || "https://yourdomain.me";
```

**Or in your `.env` file:**
```
REACT_APP_API_URL=https://yourdomain.me
```

**Update CORS in Backend [Backend/config.py](Backend/config.py):**
```python
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://yourdomain.vercel.app,https://yourdomain.me")
```

---

## Step 6: Database Migrations (if needed)

If you need to initialize database tables on Fly:
```bash
# SSH into Fly app
flyctl ssh console

# Run Flask migrations
cd /app
flask db upgrade

# Or create tables
python -c "from app import create_app, db; app = create_app(); db.create_all()"

# Exit
exit
```

---

## Troubleshooting

### 502 Bad Gateway
- Check logs: `flyctl logs`
- Verify DATABASE_URL is correct: `flyctl secrets list`
- Check Dockerfile is correct

### Database Connection Failed
- Verify DATABASE_URL format is correct
- Check database credentials
- Ensure Fly app can reach your DB (whitelisting firewall?)

### Domain Not Working
- Wait 24 hours for DNS propagation
- Check: `flyctl certs list`
- Verify nameservers in Namecheap dashboard

### Health Check Failing
- SSH in: `flyctl ssh console`
- Check Flask: `curl http://localhost:8080/health`

---

## Monitoring & Maintenance

```bash
# View logs
flyctl logs

# Check resource usage
flyctl status

# Scale your app (if needed)
flyctl scale count 1  # Change number of instances

# Restart app
flyctl restart

# View all commands
flyctl --help
```

---

## Cost Summary (Free Tier)

| Service | Cost | Notes |
|---------|------|-------|
| Fly.io Backend | **FREE** | 3 shared-cpu-1x 256MB VMs included |
| Database (Supabase) | **FREE** | 500MB storage, good for small projects |
| Domain (.me from pack) | **FREE for 1 year** | Then ~$8/year |
| **Total Year 1** | **$0** | Free entirely! |
| **Year 2+** | ~$8/year | Only domain renewal |

---

## Next Steps

1. ✅ Deploy backend to Fly.io
2. ✅ Connect custom domain
3. ✅ Update frontend API endpoint
4. ✅ Test end-to-end functionality
5. Monitor logs and fix any issues

---

## Useful Links

- Fly.io Docs: https://fly.io/docs/
- PostgreSQL Guides: https://supabase.com/docs/guides/database/connecting-to-postgres
- GitHub Student Pack: https://education.github.com/pack

---

**Happy deploying! 🚀**
