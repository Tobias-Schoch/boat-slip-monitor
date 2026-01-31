# Boat Slip Monitor - Setup Guide

Complete guide to set up and deploy the Boat Slip Monitoring System.

## Prerequisites

### Local Development
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Git

### Production (VPS)
- Ubuntu 22.04 or similar
- Docker & Docker Compose
- 2GB+ RAM
- 20GB+ storage

## Quick Start (Local Development)

### 1. Clone and Setup

```bash
# Navigate to the project
cd boat-slip-monitor

# Run setup script
./scripts/setup.sh
```

This will:
- Create `.env` from template
- Install dependencies
- Build packages
- Start PostgreSQL and Redis via Docker
- Run database migrations
- Create data directories

### 2. Configure Environment

Edit `.env` with your credentials:

```bash
# Required: Telegram (primary notification)
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_id

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_TO=your_email@gmail.com

# Optional: SMS/Voice (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_TO_PHONE_NUMBER=+1234567890
ENABLE_VOICE_CALLS=false
```

### 3. Start Services

```bash
# Start monitor service
npm run monitor

# In another terminal, start web dashboard
npm run web
```

Or use PM2 for process management:

```bash
./scripts/deploy-local.sh
```

### 4. Access Dashboard

Open http://localhost:3000 in your browser.

## Production Deployment (VPS)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (if not installed)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Log out and back in
```

### 2. Clone Repository

```bash
git clone <your-repo-url>
cd boat-slip-monitor
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env  # Edit with your credentials
```

### 4. Deploy

```bash
./scripts/deploy-vps.sh
```

This will:
- Build Docker images
- Start all services (PostgreSQL, Redis, Monitor, Web)
- Run database migrations
- Perform health checks

### 5. Verify Deployment

```bash
# Check services
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoint
curl http://localhost:3000/api/health
```

### 6. Setup Reverse Proxy (Optional)

For HTTPS and custom domain:

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure Caddy
sudo nano /etc/caddy/Caddyfile
```

Add:

```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

```bash
# Restart Caddy
sudo systemctl restart caddy
```

## Telegram Bot Setup

### 1. Create Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot`
3. Follow instructions to create your bot
4. Copy the bot token

### 2. Get Chat ID

1. Message your new bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find your `chat_id` in the response
4. Add both to `.env`

## Gmail App Password Setup

### 1. Enable 2FA

1. Go to Google Account settings
2. Enable 2-Factor Authentication

### 2. Create App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Boat Monitor"
4. Copy the generated password
5. Add to `.env` as `SMTP_PASSWORD`

## Twilio Setup (Optional)

### 1. Create Account

1. Sign up at https://www.twilio.com
2. Verify your phone number

### 2. Get Credentials

1. Get Account SID and Auth Token from dashboard
2. Get a Twilio phone number
3. Add to `.env`

## Testing

### Test Notifications

```bash
# Test Telegram
./scripts/test-notification.sh telegram

# Test Email
./scripts/test-notification.sh email

# Test SMS
./scripts/test-notification.sh sms
```

### Manual Check Trigger

```bash
# Via API
curl -X POST http://localhost:3000/api/trigger-check

# Via Database
psql boat_monitor -c "SELECT * FROM checks ORDER BY checked_at DESC LIMIT 10;"
```

## Monitoring

### View Logs

```bash
# Local (PM2)
pm2 logs

# Docker
docker-compose logs -f

# Specific service
docker-compose logs -f monitor
docker-compose logs -f web
```

### Check System Status

```bash
# PM2
pm2 status
pm2 monit

# Docker
docker-compose ps
docker stats
```

### Database Queries

```bash
# Connect to database
docker-compose exec postgres psql -U boat_monitor

# Or locally
psql boat_monitor

# Useful queries
SELECT * FROM monitored_urls;
SELECT * FROM checks ORDER BY checked_at DESC LIMIT 10;
SELECT * FROM changes ORDER BY detected_at DESC LIMIT 10;
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

## Backup & Restore

### Create Backup

```bash
./scripts/backup.sh
```

This creates:
- Database dump
- Screenshots archive
- Configuration backup

### Restore from Backup

```bash
# Restore database
psql boat_monitor < backups/db_backup_TIMESTAMP.sql

# Restore screenshots
tar -xzf backups/screenshots_backup_TIMESTAMP.tar.gz

# Restore config
cp backups/env_backup_TIMESTAMP .env
```

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull

# Local
npm install
npm run build
pm2 restart all

# Docker
./scripts/deploy-vps.sh
```

### Clean Old Data

```bash
# Delete old screenshots (older than 90 days)
find data/screenshots -type f -mtime +90 -delete

# Vacuum database
docker-compose exec postgres vacuumdb -U boat_monitor -d boat_monitor -f -z
```

### Restart Services

```bash
# PM2
pm2 restart all

# Docker
docker-compose restart

# Specific service
docker-compose restart monitor
```

## Troubleshooting

### Monitor Not Starting

```bash
# Check logs
docker-compose logs monitor

# Common issues:
# 1. Database not ready - wait 30 seconds and restart
# 2. Redis not ready - restart Redis
# 3. Playwright installation - rebuild image
```

### No Notifications

```bash
# Check notification channels
curl http://localhost:3000/api/health

# Test individual channels
./scripts/test-notification.sh telegram

# Check logs for errors
docker-compose logs -f monitor | grep -i error
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres psql -U boat_monitor -d boat_monitor -c "SELECT 1;"

# Restart PostgreSQL
docker-compose restart postgres
```

### High Memory Usage

```bash
# Check Docker stats
docker stats

# Restart Playwright (memory leak)
docker-compose restart monitor

# Or limit Playwright pool size in code
```

## Performance Tuning

### Optimize Check Interval

Edit `.env`:

```bash
CHECK_INTERVAL_MINUTES=5  # Default
# Reduce for more frequent checks (higher cost)
# Increase for less frequent checks (lower cost)
```

### Reduce Screenshot Size

Edit `packages/monitor/src/scraper/page-scraper.ts`:

```typescript
await page.screenshot({
  path: filePath,
  fullPage: false,  // Only visible area
  type: 'jpeg',     // Instead of PNG
  quality: 70       // Reduce quality
});
```

### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_checks_url_id_checked_at
ON checks(url_id, checked_at DESC);

CREATE INDEX CONCURRENTLY idx_changes_priority_detected_at
ON changes(priority, detected_at DESC);
```

## Security

### Secure Production Deployment

1. **Change default passwords**
   ```bash
   POSTGRES_PASSWORD=<strong-password>
   ```

2. **Restrict network access**
   ```bash
   # In docker-compose.yml, remove port mappings for postgres/redis
   # Access only via internal network
   ```

3. **Enable firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

4. **Setup fail2ban**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

5. **Regular updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Cost Estimation

Monthly costs for production deployment:

- **VPS**: €5-10 (Hetzner CX21, DigitalOcean Droplet)
- **Telegram**: Free
- **Email**: Free (Gmail)
- **SMS**: €0.01-0.10 per message (only CRITICAL)
- **Voice**: €0.02 per minute (optional)

Total: ~€5-15/month depending on alert frequency

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review this guide
3. Check GitHub issues
4. Contact maintainer

## License

MIT License - See LICENSE file for details
