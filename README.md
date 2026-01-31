# Bootsliegeplatz Wartelisten-Monitor

A robust 24/7 monitoring system that watches the boat slip waiting list in Konstanz and notifies you immediately via multi-channel notifications when it opens in Q1 2026.

## ✨ New! Interactive Setup

**Get started in 5 minutes** with our new interactive setup script:

```bash
cd boat-slip-monitor
./scripts/setup.sh
```

The script will:
- ✅ Guide you through Telegram bot creation
- ✅ Automatically get your Chat ID (no more empty results!)
- ✅ Generate your .env file
- ✅ Install and configure everything

**Need help with Telegram?** See our detailed guides:
- 📖 [GETTING_STARTED.md](GETTING_STARTED.md) - Step-by-step walkthrough
- 📱 [docs/TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md) - Complete Telegram guide
- 🔧 [scripts/get-telegram-chat-id.sh](scripts/get-telegram-chat-id.sh) - Chat ID helper script

## Features

- **Intelligent Monitoring**: Checks every 5 minutes with smart change detection
- **Multi-Channel Notifications**: Telegram, Email, SMS, and Voice calls
- **Next.js Dashboard**: Real-time status, history, screenshots, and settings
- **Priority System**: INFO, IMPORTANT, and CRITICAL notifications
- **Docker Deployment**: Easy local and VPS deployment

## Tech Stack

- **Backend**: Node.js/TypeScript with Playwright
- **Frontend**: Next.js 14 (App Router) with Shadcn UI
- **Database**: PostgreSQL with Drizzle ORM
- **Job Queue**: BullMQ (Redis)
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Telegram account (for notifications)

### Easy Setup (Interactive)

Run the interactive setup script that will guide you through the entire configuration:

```bash
cd boat-slip-monitor
./scripts/setup.sh
```

This will:
1. **Prompt you for all credentials** (Telegram, Email, SMS, etc.)
2. **Generate your .env file** automatically
3. Install dependencies
4. Build all packages
5. Start PostgreSQL and Redis
6. Run database migrations
7. Create required directories

**Note**: Only Telegram credentials are required. All other notification channels are optional and can be skipped.

### Manual Setup (Advanced)

If you prefer manual configuration:

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env

# Install dependencies
npm install

# Build packages
npm run build

# Start services
docker-compose up -d postgres redis

# Run migrations
npm run migrate
```

### Reconfigure Credentials

To update credentials later without re-running full setup:

```bash
./scripts/configure-credentials.sh
```

### Development

```bash
# Start monitor service only
npm run monitor

# Start web dashboard only
npm run web

# Run all services in parallel
npm run dev
```

## Project Structure

```
boat-slip-monitor/
├── packages/
│   ├── shared/          # Shared types, utils, constants
│   ├── database/        # PostgreSQL client, repositories, migrations
│   ├── monitor/         # Backend monitoring service
│   └── web/             # Next.js dashboard
├── docker-compose.yml   # Docker services configuration
├── turbo.json          # Monorepo build configuration
└── package.json        # Workspace configuration
```

## Monitored URLs

- https://www.konstanz.de/stadt+gestalten/bauen+_+wohnen/privat+bauen/bootsliegeplatz
- https://www.konstanz.de/serviceportal/-/leistungen+von+a-z/neubeantragung-bootsliegeplatz-bootsliegeplaetze/vbid6001501
- https://www.service-bw.de/zufi/leistungen/6001501?plz=78467&ags=08335043
- https://www.service-bw.de/onlineantraege/onlineantrag?processInstanceId=AZwTjGSsczqMBp3WMQZbUg

## Credential Setup

### Telegram (Required)

1. **Create a bot**:
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` and follow instructions
   - Copy the bot token

2. **Get your Chat ID**:
   - Message your new bot
   - Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   - Find `chat` → `id` in the response

### Email (Optional)

For Gmail:
1. Enable 2-Factor Authentication
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password for "Mail"
4. Use this password in the setup (not your regular Gmail password)

### SMS/Voice (Optional)

1. Sign up at https://www.twilio.com
2. Verify your phone number
3. Get Account SID and Auth Token from dashboard
4. Purchase a Twilio phone number

### Test Notifications

After setup, test your notification channels:

```bash
# Test Telegram
./scripts/test-notification.sh telegram

# Test Email (if configured)
./scripts/test-notification.sh email

# Test SMS (if configured)
./scripts/test-notification.sh sms
```

## Deployment

### Local (macOS/NAS)

```bash
docker-compose up -d postgres redis
npm run migrate
npm run build
npm run monitor &
npm run web
```

### VPS (Ubuntu 22.04)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and configure
git clone <repo-url>
cd boat-slip-monitor
cp .env.example .env
nano .env  # Fill in production values

# Deploy
docker-compose up -d

# Verify
docker-compose ps
curl http://localhost:3000/api/health
```

## License

MIT
