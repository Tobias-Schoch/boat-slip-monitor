# Scripts Directory

Utility scripts for setting up, deploying, and managing the Boat Slip Monitor.

## Setup & Configuration

### `setup.sh` - Interactive Initial Setup

**Purpose**: First-time setup with interactive credential collection

**What it does**:
- Prompts for all credentials (Telegram, Email, SMS/Voice)
- Generates `.env` file automatically
- Installs dependencies
- Builds packages
- Starts Docker services (PostgreSQL, Redis)
- Runs database migrations
- Creates data directories
- Shows configuration summary

**Usage**:
```bash
./scripts/setup.sh
```

**When to use**: First time setting up the project

**Interactive prompts**:
- Database password (optional, default: changeme)
- Telegram Bot Token (required)
- Telegram Chat ID (required)
- Email configuration (optional)
- Twilio SMS/Voice (optional)
- Check interval (optional, default: 5 minutes)
- Log level (optional, default: info)

---

### `configure-credentials.sh` - Update Credentials

**Purpose**: Reconfigure credentials without full setup

**What it does**:
- Menu-driven credential updates
- Selective configuration (all, Telegram only, Email only, etc.)
- Preserves existing settings
- Creates automatic backups
- Shows what changed

**Usage**:
```bash
./scripts/configure-credentials.sh
```

**When to use**:
- Update Telegram credentials
- Add/update Email settings
- Add/update Twilio settings
- Change database password
- Any credential changes after initial setup

**Menu options**:
1. All credentials (complete reconfiguration)
2. Telegram only
3. Email only
4. SMS/Voice (Twilio) only
5. Database password only

---

## Deployment

### `deploy-local.sh` - Local Deployment (PM2)

**Purpose**: Deploy for local/macOS/NAS environments using PM2

**What it does**:
- Builds all packages
- Starts PostgreSQL and Redis via Docker
- Runs database migrations
- Starts services with PM2
- Configures PM2 startup script

**Usage**:
```bash
./scripts/deploy-local.sh
```

**When to use**:
- Local development with background processes
- macOS deployment
- NAS deployment
- Environments where you want process management without Docker

**Requirements**:
- PM2 installed (script will install if missing)
- Docker for PostgreSQL and Redis

**Manages**:
- `boat-monitor-service` - Monitor service
- `boat-monitor-web` - Web dashboard

**Useful PM2 commands after deployment**:
```bash
pm2 logs                    # View all logs
pm2 logs boat-monitor-service  # Monitor logs only
pm2 monit                   # Real-time monitoring
pm2 restart all             # Restart services
pm2 stop all                # Stop services
pm2 delete all              # Remove services
```

---

### `deploy-vps.sh` - VPS Deployment (Docker)

**Purpose**: Deploy to VPS/cloud server using Docker Compose

**What it does**:
- Installs Docker (if missing)
- Stops existing containers
- Builds Docker images
- Starts all services (PostgreSQL, Redis, Monitor, Web)
- Runs migrations
- Performs health check

**Usage**:
```bash
./scripts/deploy-vps.sh
```

**When to use**:
- Ubuntu 22.04 or similar VPS
- Production deployment
- Cloud servers (DigitalOcean, Hetzner, AWS, etc.)
- 24/7 monitoring requirement

**Requirements**:
- Ubuntu 22.04+ (or compatible)
- 2GB+ RAM
- 20GB+ storage
- Internet connection

**Services deployed**:
- PostgreSQL (port 5432, internal)
- Redis (port 6379, internal)
- Monitor Service (background)
- Web Dashboard (port 3000)

**Useful Docker commands after deployment**:
```bash
docker-compose ps           # View services
docker-compose logs -f      # View all logs
docker-compose logs -f monitor  # Monitor logs only
docker-compose restart      # Restart all
docker-compose down         # Stop all
docker-compose up -d        # Start all
```

---

## Testing

### `test-notification.sh` - Test Notification Channels

**Purpose**: Test individual notification channels

**What it does**:
- Sends test notification to specified channel
- Uses CRITICAL priority
- Tests actual delivery
- Shows success/failure

**Usage**:
```bash
./scripts/test-notification.sh <channel>

# Examples:
./scripts/test-notification.sh telegram
./scripts/test-notification.sh email
./scripts/test-notification.sh sms
./scripts/test-notification.sh voice
```

**When to use**:
- After initial setup
- After credential changes
- To verify configuration
- To test notification delivery

**Test message**:
```
[CRITICAL] Test Notification
This is a test notification from Boat Slip Monitor
```

---

## Maintenance

### `backup.sh` - Backup Data

**Purpose**: Create backups of database, screenshots, and configuration

**What it does**:
- Exports PostgreSQL database
- Archives screenshots directory
- Backs up `.env` file
- Creates timestamped backup files

**Usage**:
```bash
./scripts/backup.sh
```

**When to use**:
- Before major updates
- Regular backups (schedule with cron)
- Before VPS migration
- Before credential changes

**Creates**:
- `backups/db_backup_YYYYMMDD_HHMMSS.sql`
- `backups/screenshots_backup_YYYYMMDD_HHMMSS.tar.gz`
- `backups/env_backup_YYYYMMDD_HHMMSS`

**Restore commands**:
```bash
# Restore database
psql boat_monitor < backups/db_backup_YYYYMMDD_HHMMSS.sql

# Or with Docker:
docker-compose exec -T postgres psql -U boat_monitor < backups/db_backup_YYYYMMDD_HHMMSS.sql

# Restore screenshots
tar -xzf backups/screenshots_backup_YYYYMMDD_HHMMSS.tar.gz

# Restore .env
cp backups/env_backup_YYYYMMDD_HHMMSS .env
```

---

## Script Permissions

All scripts should be executable. If not, run:

```bash
chmod +x scripts/*.sh
```

## Script Dependencies

### All scripts require:
- Bash shell
- Current working directory: project root

### Individual requirements:
- `setup.sh`: npm, Docker, Docker Compose
- `configure-credentials.sh`: None (can run standalone)
- `deploy-local.sh`: npm, Docker, PM2 (auto-installs)
- `deploy-vps.sh`: Docker, Docker Compose (auto-installs)
- `test-notification.sh`: curl, running services
- `backup.sh`: pg_dump (or Docker with PostgreSQL), tar

## Environment Variables

All scripts expect `.env` file in project root with:

**Required**:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `DATABASE_URL` or `POSTGRES_PASSWORD`

**Optional**:
- `SMTP_*` - Email configuration
- `TWILIO_*` - SMS/Voice configuration
- `CHECK_INTERVAL_MINUTES`
- `LOG_LEVEL`

## Troubleshooting

### Script won't run

```bash
chmod +x scripts/<script-name>.sh
```

### Docker not found (deploy-vps.sh)

Script will auto-install Docker. If it fails:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
```

### PM2 not found (deploy-local.sh)

Script will auto-install PM2. If it fails:
```bash
npm install -g pm2
```

### Permission denied (backup.sh)

```bash
sudo ./scripts/backup.sh
```

### Services not starting

Check Docker:
```bash
docker-compose ps
docker-compose logs
```

Check ports:
```bash
lsof -i :3000  # Web dashboard
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

## Best Practices

1. **Run setup.sh first** - Always start with interactive setup
2. **Test after changes** - Use test-notification.sh after credential updates
3. **Regular backups** - Schedule backup.sh with cron
4. **Check logs** - Monitor logs after deployment
5. **Use appropriate deployment** - Local for dev, VPS for production

## Cron Examples

**Daily backup at 2 AM**:
```bash
0 2 * * * cd /path/to/boat-slip-monitor && ./scripts/backup.sh
```

**Weekly cleanup (delete backups older than 30 days)**:
```bash
0 3 * * 0 find /path/to/boat-slip-monitor/backups -mtime +30 -delete
```

## Contributing

When adding new scripts:
1. Add documentation here
2. Make executable: `chmod +x`
3. Include clear error messages
4. Follow existing patterns
5. Test on clean system

## Support

- Main docs: [../README.md](../README.md)
- Setup guide: [../SETUP.md](../SETUP.md)
- Quick start: [../QUICK_START.md](../QUICK_START.md)
- Architecture: [../ARCHITECTURE.md](../ARCHITECTURE.md)
