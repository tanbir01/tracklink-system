# TrackLink Production Deployment Guide

This guide details steps for deploying the TrackLink stack on an Ubuntu VPS using Docker, Compose, and Let's Encrypt certificates.

## Prerequisites
- An Ubuntu Server with Docker and Docker Compose installed.
- A registered domain name (e.g. `tracklink.yourdomain.com`).
- DNS A Record pointing your domain to the server IP.
- Ports `80` and `443` open on the server firewall.

---

## Step 1: Clone and Set Up Environment
Clone the repository and create your configuration files:
```bash
git clone https://github.com/your-username/tracklink.git /opt/tracklink
cd /opt/tracklink
cp .env.example .env
```

Edit the `.env` file to configure production secrets:
- Change default database and Redis passwords.
- Configure `CORS_ORIGINS` to match your domain (e.g., `https://tracklink.yourdomain.com`).
- Modify JWT secret key.

---

## Step 2: Let's Encrypt SSL Certificates
Use Certbot to generate trusted SSL certificates for your domain:
```bash
sudo apt update
sudo apt install -y certbot
sudo certbot certonly --standalone -d tracklink.yourdomain.com
```

This will save certificates to `/etc/letsencrypt/live/tracklink.yourdomain.com/`.

Copy or link the certificates to the Nginx configuration directory:
```bash
mkdir -p /opt/tracklink/nginx/ssl
cp /etc/letsencrypt/live/tracklink.yourdomain.com/fullchain.pem /opt/tracklink/nginx/ssl/fullchain.pem
cp /etc/letsencrypt/live/tracklink.yourdomain.com/privkey.pem /opt/tracklink/nginx/ssl/privkey.pem
```

---

## Step 3: Configure Nginx for SSL
Uncomment the HTTPS block in `/opt/tracklink/nginx/nginx.conf` and update the server names:
```nginx
server {
    listen 443 ssl http2;
    server_name tracklink.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # ... include location routes from HTTP block
}
```

Ensure HSTS and CSP headers are active.

---

## Step 4: Launch Containers
Start the production services:
```bash
docker-compose up -d --build
```

Verify all containers are active:
```bash
docker-compose ps
```

---

## Troubleshooting & Maintenance

### Check Logs
```bash
docker-compose logs -f backend
docker-compose logs -f nginx
```

### Database Backup
Set up a cron job to automatically back up the database:
```bash
docker-compose exec -t postgres pg_dumpall -c -U tracklink > /opt/tracklink/backups/dump_$(date +%F).sql
```
