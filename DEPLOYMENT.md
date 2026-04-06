# FYP Portal - Production Deployment Guide

## Domain: iiui-fyp-portal.me
## Hosting: DigitalOcean Droplet

---

## STEP 1: Point Domain to Droplet

In **Namecheap DNS Settings**, add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_DROPLET_IP | Automatic |
| A | www | YOUR_DROPLET_IP | Automatic |

Replace `YOUR_DROPLET_IP` with your actual droplet IP address.

---

## STEP 2: SSH into Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

---

## STEP 3: Install Docker & Docker Compose (Run on Droplet)

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

---

## STEP 4: Clone Repository (Run on Droplet)

```bash
# Install git if needed
apt install git -y

# Clone your repo
cd /opt
git clone https://github.com/YOUR_USERNAME/fyp.git fyp-portal
cd fyp-portal
```

---

## STEP 5: Configure Environment Variables (Run on Droplet)

```bash
# Create .env file from example
cp .env.example .env

# Edit with your actual values
nano .env
```

**Edit the .env file with these values:**
```
MYSQL_ROOT_PASSWORD=YourVeryStrongDatabasePassword123!
SECRET_KEY=generate_a_random_64_char_string_here
JWT_SECRET_KEY=generate_another_random_64_char_string_here
MAIL_USERNAME=your_actual_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_DEFAULT_SENDER=your_actual_email@gmail.com
```

**Generate random secrets:**
```bash
# Run this to generate random keys
openssl rand -hex 32
```

---

## STEP 6: Deploy with Docker (Run on Droplet)

```bash
# Navigate to project
cd /opt/fyp-portal

# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# View logs (wait for healthy status)
docker compose -f docker-compose.prod.yml logs -f
# Press Ctrl+C to exit logs
```

---

## STEP 7: Verify Deployment

1. Wait 2-3 minutes for SSL certificate to be issued
2. Visit: https://iiui-fyp-portal.me
3. Check backend health: https://iiui-fyp-portal.me/api/health

---

## Useful Commands (Run on Droplet)

```bash
# View running containers
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop all services
docker compose -f docker-compose.prod.yml down

# Update and redeploy
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Access MySQL shell
docker exec -it fyp-mysql mysql -u root -p

# Access backend container
docker exec -it fyp-backend bash
```

---

## Troubleshooting

### SSL not working?
- Ensure DNS is pointing to droplet (may take up to 48 hours)
- Check Caddy logs: `docker compose -f docker-compose.prod.yml logs caddy`

### Database connection issues?
- Check MySQL logs: `docker compose -f docker-compose.prod.yml logs db`
- Ensure MySQL is healthy: `docker compose -f docker-compose.prod.yml ps`

### Backend errors?
- Check logs: `docker compose -f docker-compose.prod.yml logs backend`
- Verify .env variables are correct

---

## File Structure

```
fyp-portal/
├── Backend/
│   ├── Dockerfile          # Backend container config
│   └── ...
├── Dockerfile              # Frontend container config
├── docker-compose.yml      # Local development
├── docker-compose.prod.yml # Production with SSL
├── Caddyfile              # Caddy reverse proxy config
├── nginx.conf             # Nginx config (used inside frontend container)
├── .env.example           # Environment template
└── .env                   # Your actual secrets (DO NOT COMMIT)
```
