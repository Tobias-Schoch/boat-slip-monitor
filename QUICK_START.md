# Quick Start Guide

Get your Boat Slip Monitor running in 5 minutes!

## Prerequisites Check

Before starting, make sure you have:

- [ ] Node.js 20+ installed (`node --version`)
- [ ] Docker installed (`docker --version`)
- [ ] A Telegram account

## Step 1: Get Telegram Credentials (5 min)

### Create Your Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name (e.g., "Boat Slip Alert")
4. Choose a username (e.g., "boat_slip_alert_bot")
5. **Copy the bot token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Get Your Chat ID

1. Send a message to your new bot (any message)
2. Open this URL in your browser (replace TOKEN):
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
3. Look for `"chat":{"id":` and **copy the number** (e.g., `123456789`)

**That's it!** You now have everything required. Email and SMS are optional.

## Step 2: Run Setup (2 min)

```bash
cd boat-slip-monitor
./scripts/setup.sh
```

The script will ask you for:

1. **Database password** (press Enter for default)
2. **Telegram Bot Token** (paste from Step 1)
3. **Telegram Chat ID** (paste from Step 1)
4. **Email setup?** (type `n` to skip, or `y` to configure)
5. **SMS setup?** (type `n` to skip, or `y` to configure)
6. **Check interval** (press Enter for 5 minutes)

The script will then:
- Generate your `.env` file ✓
- Install dependencies ✓
- Build the project ✓
- Start PostgreSQL and Redis ✓
- Run database migrations ✓
- Create data directories ✓

## Step 3: Start Services (1 min)

### Option A: Two Terminals (Development)

Terminal 1 - Start Monitor:
```bash
npm run monitor
```

Terminal 2 - Start Dashboard:
```bash
npm run web
```

### Option B: PM2 (Background Process)

```bash
./scripts/deploy-local.sh
```

### Option C: Docker (Production-like)

```bash
docker-compose up -d
```

## Step 4: Test & Verify (1 min)

1. **Open Dashboard**: http://localhost:3000

2. **Test Telegram Notification**:
   ```bash
   ./scripts/test-notification.sh telegram
   ```

   You should receive a message on Telegram within seconds! 🎉

3. **Check the Dashboard**: You should see:
   - System Status: **Online** (green)
   - Monitored URLs: **4 active**
   - Recent Checks: **Empty** (will populate after first check in 5 min)

## Step 5: Wait for First Check

The system will perform its first check within 5 minutes. You'll see:

- New entries in "Recent Checks" on dashboard
- No notifications (first check is baseline)
- Screenshots saved in `data/screenshots/`

## What Happens Next?

Every 5 minutes, the system will:
1. Check all 4 boat slip URLs
2. Compare with previous version
3. Detect changes (forms, keywords, content)
4. Send notifications if change detected
5. Update dashboard with results

### Notification Priorities

- **INFO** (Blue): Minor content changes → Telegram only
- **IMPORTANT** (Yellow): Important keywords → Telegram + Email
- **CRITICAL** (Red): Forms/waiting list open → All channels (Telegram + Email + SMS + Voice)

## Troubleshooting

### No notifications?

Check notification channels:
```bash
cat .env | grep -E "TELEGRAM|SMTP|TWILIO"
```

Make sure your Telegram credentials are correct.

### Services not starting?

Check Docker services:
```bash
docker-compose ps
```

Both `postgres` and `redis` should be "healthy".

### Monitor crashes?

Check logs:
```bash
# PM2
pm2 logs boat-monitor-service

# Docker
docker-compose logs -f monitor

# Manual
Check terminal output
```

### Dashboard not loading?

Make sure web service is running:
```bash
# Check if running
curl http://localhost:3000/api/health

# Should return: {"status":"healthy"}
```

## Common Issues

### "Database connection failed"

Wait 30 seconds for PostgreSQL to fully start, then restart monitor.

### "Playwright browsers not found"

```bash
npx playwright install chromium
```

### "Port 3000 already in use"

Stop other services using port 3000:
```bash
lsof -ti:3000 | xargs kill -9
```

## Useful Commands

```bash
# View all logs (PM2)
pm2 logs

# View monitor logs only
pm2 logs boat-monitor-service

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# View dashboard
open http://localhost:3000

# Test notifications
./scripts/test-notification.sh telegram

# Update credentials
./scripts/configure-credentials.sh

# Backup data
./scripts/backup.sh
```

## Next Steps

1. **Configure Email** (optional but recommended):
   ```bash
   ./scripts/configure-credentials.sh
   ```
   Select option 3 (Email only)

2. **Configure SMS/Voice** (optional):
   Sign up at twilio.com, then:
   ```bash
   ./scripts/configure-credentials.sh
   ```
   Select option 4 (Twilio only)

3. **Customize Check Interval**:
   Edit `.env` and change `CHECK_INTERVAL_MINUTES`

4. **Deploy to VPS** (for 24/7 monitoring):
   See SETUP.md for detailed VPS deployment instructions

## Support

- 📚 Detailed Setup: [SETUP.md](SETUP.md)
- 🏗️ Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- 📝 Full Docs: [README.md](README.md)
- 🐛 Issues: GitHub Issues

## Success Checklist

- [ ] Telegram bot created
- [ ] Setup script completed successfully
- [ ] Services running (monitor + web)
- [ ] Dashboard accessible at http://localhost:3000
- [ ] Test notification received on Telegram
- [ ] First check completed (wait 5 minutes)
- [ ] System Status shows "Online"

**You're all set!** 🚤 The system will now monitor 24/7 and alert you when the waiting list opens!

---

**Pro Tip**: Set up your VPS deployment for true 24/7 monitoring that runs even when your computer is off. See SETUP.md for instructions.
