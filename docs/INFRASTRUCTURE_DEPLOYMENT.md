# Infrastructure & Deployment Configuration

Platform-specific setup for security features deployment.

## Vercel Deployment

### Environment Variables Setup
1. Go to **Project Settings → Environment Variables**
2. Add for **Production**:
   ```
   NODE_ENV = production
   DATABASE_URL = (from Neon Cloud)
   NEXTAUTH_SECRET = (generated)
   ENCRYPTION_KEY = (32-byte hex)
   SUMUP_WEBHOOK_SECRET = (from SumUp)
   UPSTASH_REDIS_REST_URL = (from Upstash)
   UPSTASH_REDIS_REST_TOKEN = (from Upstash)
   ```

### Webhook Configuration
1. SumUp Webhook URL: `https://yourdomain.com/api/payments/webhook/sumup`
2. Configure signature verification in project
3. Set `SUMUP_WEBHOOK_SECRET` matching SumUp settings

### Vercel Functions Configuration
- All API routes automatically become serverless functions
- Cold start optimization: Keep functions warm with monitoring
- Memory allocation: Default 1024MB sufficient for all features

### Monitoring & Logs
1. View logs: **Deployments → Logs**
2. Set up alerts: **Settings → Alerts**
3. Monitor performance: **Analytics → Performance**

---

## Docker Deployment

### Dockerfile Configuration
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build application
COPY . .
RUN npm run build

# Start application
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose with Secrets
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_SECRET_FILE: /run/secrets/nextauth_secret
      ENCRYPTION_KEY_FILE: /run/secrets/encryption_key
    secrets:
      - nextauth_secret
      - encryption_key
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: malam_suya
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

secrets:
  nextauth_secret:
    file: ./secrets/nextauth.secret
  encryption_key:
    file: ./secrets/encryption.key
  db_password:
    file: ./secrets/db.password

volumes:
  redis_data:
  postgres_data:
```

### Running with Docker
```bash
# Build image
docker build -t home-of-suya:latest .

# Run with environment file
docker run --env-file .env.docker \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  home-of-suya:latest

# Run with Docker Compose
docker-compose up -d
```

---

## AWS EC2 Deployment

### EC2 Instance Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL client
sudo apt install -y postgresql-client

# Install Redis (optional, use AWS ElastiCache in production)
sudo apt install -y redis-server

# Install PM2 for process management
sudo npm install -g pm2
```

### Application Setup
```bash
cd /opt/app
git clone https://github.com/yourusername/HOME_OF_SUYA.git
cd HOME_OF_SUYA

# Install dependencies
npm install

# Build application
npm run build

# Create .env file with secrets from AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id app-secrets > .env

# Start with PM2
pm2 start npm --name "home-of-suya" -- start
pm2 save
pm2 startup
```

### AWS Secrets Manager Integration
```bash
# Store secrets
aws secretsmanager create-secret --name app-secrets \
  --secret-string '{
    "DATABASE_URL": "postgresql://...",
    "NEXTAUTH_SECRET": "...",
    "ENCRYPTION_KEY": "...",
    "SUMUP_WEBHOOK_SECRET": "..."
  }'

# Retrieve in application
aws secretsmanager get-secret-value --secret-id app-secrets
```

### Security Groups Configuration
```
Inbound Rules:
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
- SSH (22) from [your-ip]/32
- PostgreSQL (5432) from [app-sg]/32
- Redis (6379) from [app-sg]/32

Outbound Rules:
- All traffic to 0.0.0.0/0
```

### SSL/TLS Certificate
```bash
# Use AWS Certificate Manager or Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Set up auto-renewal
sudo systemctl enable certbot.timer
```

---

## Linux Server Deployment (Manual)

### Installation Script
```bash
#!/bin/bash

# Variables
APP_DIR="/opt/home-of-suya"
APP_USER="suya"

# Create application user
sudo useradd -m -s /bin/bash $APP_USER

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install -y nginx

# Install PostgreSQL
sudo apt install -y postgresql-client

# Clone repository
sudo mkdir -p $APP_DIR
sudo git clone https://github.com/yourusername/HOME_OF_SUYA.git $APP_DIR
sudo chown -R $APP_USER:$APP_USER $APP_DIR

# Install dependencies
cd $APP_DIR
sudo -u $APP_USER npm install
sudo -u $APP_USER npm run build

# Create systemd service
sudo tee /etc/systemd/system/home-of-suya.service > /dev/null <<EOF
[Unit]
Description=Home of Suya Application
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/node /opt/.next/standalone/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable home-of-suya
sudo systemctl start home-of-suya
```

### Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Webhook endpoints (don't cache)
    location /api/payments/webhook/ {
        proxy_pass http://localhost:3000;
        proxy_cache_bypass 1;
        proxy_no_cache 1;
    }
}
```

### Systemd Service Management
```bash
# Start service
sudo systemctl start home-of-suya

# Check status
sudo systemctl status home-of-suya

# View logs
sudo journalctl -u home-of-suya -f

# Restart service
sudo systemctl restart home-of-suya

# Stop service
sudo systemctl stop home-of-suya
```

---

## Database Configuration

### PostgreSQL on Cloud (Recommended)
- **Neon Cloud**: Free tier with good security
- **AWS RDS**: Managed database service
- **DigitalOcean Managed Databases**: Simple setup

### PostgreSQL Local Setup
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE malam_suya;

# Create schema
CREATE SCHEMA malam_suya;

# Create user with password
CREATE USER suya_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE malam_suya TO suya_user;

# Connection string
DATABASE_URL="postgresql://suya_user:secure_password@localhost:5432/malam_suya?schema=malam_suya"
```

### Backup Configuration
```bash
#!/bin/bash
# Daily backup script

BACKUP_DIR="/backups/postgres"
DB_NAME="malam_suya"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Dump database
pg_dump -U suya_user $DB_NAME | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

---

## Redis/Cache Configuration

### Option 1: Upstash (Recommended for Serverless)
1. Go to https://upstash.com
2. Create Redis database
3. Copy credentials:
   ```env
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

### Option 2: Local Redis
```bash
# Install
sudo apt install -y redis-server

# Configure /etc/redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru

# Start service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Connection
REDIS_URL="redis://localhost:6379"
```

### Option 3: AWS ElastiCache
1. Create ElastiCache Redis cluster
2. Configure security group
3. Update connection string:
   ```env
   REDIS_URL="redis://your-endpoint:6379"
   ```

---

## Monitoring & Observability

### Application Monitoring
- **PM2 Plus**: Real-time monitoring for PM2
- **New Relic**: Application performance monitoring
- **Datadog**: Infrastructure and application monitoring

### Log Aggregation
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Graylog**: Log management platform
- **Papertrail**: Cloud-based log management

### Uptime Monitoring
- **Uptimerobot**: Free uptime monitoring
- **Pingdom**: Website monitoring
- **Datadog**: APM and uptime monitoring

### Database Monitoring
```sql
-- PostgreSQL query performance
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Security Hardening Checklist

- [ ] Enable firewall (ufw/iptables)
- [ ] Configure fail2ban for SSH
- [ ] Set up SSL/TLS certificates
- [ ] Enable HTTPS redirect
- [ ] Configure security headers
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Database encryption at rest
- [ ] Database encryption in transit
- [ ] Secrets in secure manager
- [ ] Regular backups tested
- [ ] Disaster recovery plan
- [ ] Security monitoring active
- [ ] Incident response plan

---

## Troubleshooting

### Application won't start
```bash
# Check logs
npm run dev

# Verify environment variables
printenv | grep -E "DATABASE_URL|NEXTAUTH|ENCRYPTION"

# Check port availability
lsof -i :3000
```

### Database connection issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check PostgreSQL service
systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql.log
```

### Redis connection issues
```bash
# Test connection
redis-cli ping

# Check Redis service
systemctl status redis-server

# Monitor Redis
redis-cli monitor
```

---

**Last Updated**: 2026-09-09
**Version**: 1.0.0
