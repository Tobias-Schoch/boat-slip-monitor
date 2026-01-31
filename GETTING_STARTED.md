# Getting Started - Boat Slip Monitor

The easiest way to set up your 24/7 monitoring system.

## 🎯 What You Get

A fully automated system that:
- ✅ Checks 4 URLs every 5 minutes
- ✅ Detects when the waiting list opens
- ✅ Sends instant Telegram notifications
- ✅ Shows live dashboard with history
- ✅ Captures screenshots of changes
- ✅ Runs 24/7 reliably

## 📱 Step 1: Get Telegram Ready (3 minutes)

**Why Telegram?** It's free, instant, and works on all devices.

### Quick Method

```bash
cd boat-slip-monitor

# Run the helper script
./scripts/get-telegram-chat-id.sh
```

The script will guide you through:
1. Creating a bot with @BotFather
2. Getting your Chat ID automatically

### Detailed Instructions

If you prefer step-by-step: See [docs/TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md)

### Visual Guide

For a flowchart: See [docs/TELEGRAM_SETUP_FLOWCHART.md](docs/TELEGRAM_SETUP_FLOWCHART.md)

## 🚀 Step 2: Run Interactive Setup (5 minutes)

```bash
./scripts/setup.sh
```

The script will:
1. **Ask for credentials** (with helpful instructions)
2. **Generate your .env file** automatically
3. **Install everything** needed
4. **Start the services** (PostgreSQL, Redis)
5. **Run migrations** to create database
6. **Show you what's configured**

### What It Asks For

**Required**:
- ✅ Telegram Bot Token (from Step 1)
- ✅ Telegram Chat ID (from Step 1)

**Optional** (press Enter to skip):
- Email (Gmail with app password)
- SMS/Voice (Twilio account)

### Example Session

```
📊 Database Configuration
PostgreSQL password [default: changeme]: [Press Enter]

📱 Telegram Configuration (REQUIRED)
Step 1: Create your Telegram bot
  [Instructions shown...]

Telegram Bot Token: 123456789:ABCdefGHI...

Step 2: Get your Chat ID
Do you want to use our helper script? (y/n) [y]: y

📱 IMPORTANT: Before continuing!
1. Open Telegram
2. Search for your bot
3. Click START
4. Press Enter when done...

✅ Chat ID found: 987654321

📧 Email Configuration
Do you want to configure Email? (y/n) [n]: n

📞 SMS/Voice Configuration
Do you want to configure SMS/Voice? (y/n) [n]: n

⚙️  Application Configuration
Check interval in minutes [default: 5]: [Press Enter]

💾 Generating .env file...
✅ .env file created successfully!

[... installation continues ...]

✅ Setup complete!
```

## 🎮 Step 3: Start Monitoring

Choose your preferred method:

### Option A: Development Mode (Two Terminals)

Terminal 1:
```bash
npm run monitor
```

Terminal 2:
```bash
npm run web
```

### Option B: Background Mode (PM2)

```bash
./scripts/deploy-local.sh
```

View logs anytime:
```bash
pm2 logs
```

### Option C: Docker (Production)

```bash
docker-compose up -d
```

View logs:
```bash
docker-compose logs -f
```

## ✅ Step 4: Verify Everything Works

### Check 1: Dashboard

Open http://localhost:3000

You should see:
- System Status: **Online** ✅
- Monitored URLs: **4 active** ✅
- Configuration summary ✅

### Check 2: Test Telegram

```bash
./scripts/test-notification.sh telegram
```

Within seconds, you should receive:
- A formatted message with emoji
- Inline buttons ("View Dashboard", "Acknowledge")
- Current timestamp

### Check 3: Wait for First Check

The monitor runs every 5 minutes. After the first check:
- Dashboard shows "Recent Checks"
- Screenshots appear in `data/screenshots/`
- No notification (first check is baseline)

## 🎊 You're Done!

Your system is now monitoring 24/7!

### What Happens Next?

**Every 5 minutes**:
1. System checks all 4 URLs
2. Compares with previous version
3. Detects changes (content, keywords, forms)
4. Sends notifications if needed
5. Updates dashboard

**When the waiting list opens**:
1. 🚨 **CRITICAL** notification sent
2. Telegram message with details
3. Email with screenshot (if configured)
4. SMS alert (if configured)
5. Optional voice call

## 📚 Need Help?

### Common Issues

**Empty Telegram result?**
→ See [docs/TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md#troubleshooting)

**Services won't start?**
→ Check Docker: `docker-compose ps`

**No notifications?**
→ Test each channel: `./scripts/test-notification.sh telegram`

**Dashboard not loading?**
→ Check: `curl http://localhost:3000/api/health`

### Documentation

- 📖 **This Guide** - You are here!
- 🚀 [QUICK_START.md](QUICK_START.md) - 5-minute quick start
- ⚙️ [SETUP.md](SETUP.md) - Detailed setup guide
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- 📱 [docs/TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md) - Telegram guide
- 📊 [docs/TELEGRAM_SETUP_FLOWCHART.md](docs/TELEGRAM_SETUP_FLOWCHART.md) - Visual guide
- 📜 [scripts/README.md](scripts/README.md) - All scripts explained

### Scripts Available

```bash
# Setup & Configuration
./scripts/setup.sh                      # Interactive initial setup
./scripts/configure-credentials.sh      # Update credentials later
./scripts/get-telegram-chat-id.sh      # Get Telegram Chat ID

# Deployment
./scripts/deploy-local.sh              # Deploy with PM2
./scripts/deploy-vps.sh                # Deploy to VPS with Docker

# Testing
./scripts/test-notification.sh telegram  # Test Telegram
./scripts/test-notification.sh email    # Test Email
./scripts/test-notification.sh sms      # Test SMS

# Maintenance
./scripts/backup.sh                    # Backup database & screenshots
```

## 🎯 Pro Tips

### 1. Configure Email (Recommended)

Even if you skip during setup, add Email later:

```bash
./scripts/configure-credentials.sh
# Select option 3 (Email only)
```

Why? Backup notification if Telegram fails.

### 2. Deploy to VPS for True 24/7

Local setup requires your computer to be on. For real 24/7:

```bash
# On your VPS (Ubuntu 22.04):
git clone <repo-url>
cd boat-slip-monitor
./scripts/setup.sh
./scripts/deploy-vps.sh
```

**Cost**: ~€5-10/month (Hetzner, DigitalOcean)

### 3. Set Up Monitoring Alerts

Get alerted if the system itself goes down:

1. Sign up at [healthchecks.io](https://healthchecks.io) (free)
2. Add a ping URL to your monitor
3. Get alerts if checks stop

### 4. Customize Check Interval

Want faster checks?

```bash
# Edit .env
CHECK_INTERVAL_MINUTES=3

# Restart
pm2 restart all
# or
docker-compose restart
```

**Note**: More frequent = higher resource usage

### 5. Add Multiple Notification Channels

Configure all channels for redundancy:
- Telegram (instant)
- Email (backup)
- SMS (critical only)

## 🎉 Success Checklist

- [ ] Telegram bot created
- [ ] Bot token and Chat ID obtained
- [ ] Setup script completed
- [ ] .env file generated
- [ ] Services running (monitor + web)
- [ ] Dashboard accessible (http://localhost:3000)
- [ ] Test notification received
- [ ] System Status shows "Online"
- [ ] First check completed (wait 5 minutes)

**All checked?** You're ready! 🚀

## 🆘 Still Stuck?

1. **Check logs first**:
   ```bash
   pm2 logs              # If using PM2
   docker-compose logs   # If using Docker
   ```

2. **Run health check**:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Review documentation**:
   - [QUICK_START.md](QUICK_START.md)
   - [docs/TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md)

4. **Test individual components**:
   ```bash
   # Test database
   docker-compose ps postgres

   # Test Redis
   docker-compose ps redis

   # Test Telegram
   ./scripts/test-notification.sh telegram
   ```

## 🚤 Ready to Monitor!

Your system is now watching the boat slip waiting list 24/7. When it opens, you'll be the first to know!

**What to expect**:
- ✅ Silent monitoring (no spam)
- ✅ Instant alerts on real changes
- ✅ Screenshots of every change
- ✅ Complete history in dashboard
- ✅ Multiple notification channels

**Estimated time to get a spot**: When the list opens in Q1 2026, you'll have minutes to hours to respond (based on historical patterns).

Good luck getting your boat slip! ⛵

---

**Questions?** Check the docs/ folder for detailed guides on every aspect of the system.
