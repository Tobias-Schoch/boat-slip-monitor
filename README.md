<div align="center">

# 🔍 Website Change Monitor

**Intelligent 24/7 website monitoring with smart notifications**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

[Features](#-features) •
[Quick Start](#-quick-start) •
[Demo](#-demo) •
[Documentation](#-documentation) •
[Contributing](#-contributing)

</div>

---

## 🎯 What is this?

Website Change Monitor is a **production-ready monitoring system** that tracks changes on websites and sends intelligent notifications when important updates are detected. Perfect for monitoring:

- 🎟️ Registration openings
- 📦 Product availability
- 📰 News and announcements
- 💼 Job postings
- 🏛️ Government portals
- 🎫 Event tickets
- ...and any website you care about!

## ✨ Features

<table>
<tr>
<td width="50%">

### 🧠 Intelligent Detection
- **Hash-based comparison** (memory efficient)
- **Keyword matching** (customizable)
- **Form detection** (HTML & PDF)
- **Screenshot capture** for visual verification
- **Priority system** (INFO, IMPORTANT, CRITICAL)

</td>
<td width="50%">

### 📢 Rich Notifications
- **Telegram** with inline buttons & rich formatting
- **Email** with beautiful HTML templates
- **SMS** via Twilio (optional)
- **Voice calls** (optional)
- Multi-channel delivery

</td>
</tr>
<tr>
<td>

### 🎨 Modern Dashboard
- **Real-time monitoring** status
- **Change history** with diffs
- **Screenshot gallery**
- **Settings management**
- Dark mode support

</td>
<td>

### 🐳 Production Ready
- **Docker Compose** setup included
- **Health checks** and auto-restart
- **Database migrations** automated
- **Startup validation** with helpful errors
- VPS deployment guide

</td>
</tr>
</table>

## 🚀 Quick Start

### Prerequisites

```bash
# Required
✓ Node.js 20+
✓ Docker Desktop
✓ Telegram account (for notifications)

# Optional
✓ Gmail (for email notifications)
✓ Twilio (for SMS/voice)
```

### Installation (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/website-change-monitor.git
cd website-change-monitor

# Run automated setup
./scripts/quick-setup.sh
```

The script will:
1. ✅ Create your `.env` file
2. ✅ Start PostgreSQL & Redis
3. ✅ Install dependencies
4. ✅ Build all packages
5. ✅ Run database migrations

### Configuration (3 minutes)

**Get your Telegram bot token:**

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow instructions
3. Copy your bot token

**Get your Chat ID:**

1. Message your bot (any text)
2. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find `"chat":{"id":123456789}`

**Add to `.env`:**

```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
TELEGRAM_CHAT_ID=123456789
```

### Start Monitoring

```bash
# Terminal 1: Start monitor
npm run monitor

# Terminal 2: Start dashboard
npm run web
```

Open http://localhost:3000 and add your first URL! 🎉

## 🎬 Demo

<div align="center">

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### Telegram Notification
![Telegram](https://via.placeholder.com/400x600?text=Telegram+Notification)

### Email Notification
![Email](https://via.placeholder.com/600x400?text=Email+Notification)

</div>

## 📚 Documentation

### Architecture

```
┌─────────────────────────────────────────┐
│           🌐 Websites                   │
└────────────────┬────────────────────────┘
                 │
          ┌──────┴──────┐
          │  Playwright │  (Browser automation)
          │   Scraper   │
          └──────┬──────┘
                 │
          ┌──────┴──────┐
          │    Change   │  (Smart detection)
          │   Detector  │
          └──────┬──────┘
                 │
     ┌───────────┴───────────┐
     │   Notification        │
     │   Dispatcher          │
     └───┬───────────┬───────┘
         │           │
    ┌────┴────┐ ┌───┴────┐
    │Telegram │ │ Email  │
    └─────────┘ └────────┘
```

### Project Structure

```
website-change-monitor/
├── packages/
│   ├── shared/          # Types, utilities, constants
│   ├── database/        # PostgreSQL schemas & migrations
│   ├── monitor/         # Background monitoring service
│   └── web/             # Next.js dashboard
├── scripts/             # Helper scripts
├── docker-compose.yml   # Production deployment
└── README.md            # You are here!
```

### Configuration Options

#### Check Interval

Configure how often to check each URL:

```typescript
// In dashboard: Settings → Check Interval (minutes)
// Or in .env:
CHECK_INTERVAL_MINUTES=5  // Default: 5 minutes
```

#### Custom Keywords

Edit `packages/shared/src/constants/urls.ts`:

```typescript
// Trigger CRITICAL notifications
export const CRITICAL_KEYWORDS = [
  'available',
  'in stock',
  'register now',
  'apply now',
  'booking open'
];

// Trigger IMPORTANT notifications
export const IMPORTANT_KEYWORDS = [
  'updated',
  'new',
  'announcement',
  'deadline'
];
```

Then rebuild: `npm run build`

### Adding URLs

1. Open dashboard at http://localhost:3000
2. Click **"URLs"** tab
3. Click **"Add URL"**
4. Fill in:
   - **Name**: Friendly identifier
   - **URL**: Complete URL to monitor
   - **Description**: What you're watching for
   - **Check Interval**: Minutes between checks
5. Click **"Save"**

The monitor will automatically start checking your URL!

## 🐳 Docker Deployment

### Quick Deploy

```bash
# Configure environment
cp .env.example .env
nano .env

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec monitor npm run migrate

# Check status
docker-compose ps
```

### Production (VPS)

```bash
# On your server
git clone <your-repo>
cd website-change-monitor

# Configure for production
cp .env.example .env
nano .env  # Set strong passwords!

# Deploy
docker-compose up -d

# View logs
docker-compose logs -f monitor
```

For HTTPS setup with Nginx/Caddy, see [ARCHITECTURE.md](ARCHITECTURE.md).

## 🔧 Troubleshooting

<details>
<summary><b>Monitor won't start</b></summary>

```bash
# Check logs
docker-compose logs monitor

# Verify database connection
docker-compose exec postgres psql -U website_monitor

# Run migrations
docker-compose exec monitor npm run migrate
```
</details>

<details>
<summary><b>No notifications received</b></summary>

1. Check credentials in dashboard → Settings
2. Verify Telegram bot token is correct
3. Message your bot to activate it
4. Check logs: `docker-compose logs -f monitor | grep -i notification`
</details>

<details>
<summary><b>Database connection failed</b></summary>

```bash
# Check services are running
docker-compose ps

# Verify DATABASE_URL in .env:
# For Docker: postgresql://website_monitor:password@postgres:5432/website_monitor
# For Local:  postgresql://website_monitor:password@localhost:5432/website_monitor
```
</details>

<details>
<summary><b>Port 3000 already in use</b></summary>

```bash
# Find what's using it
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```
</details>

## 🎨 Customization

### Email Templates

Edit `packages/monitor/src/notifier/channels/email.ts` to customize the HTML email template.

### Telegram Messages

Edit `packages/monitor/src/notifier/channels/telegram.ts` to customize message formatting.

### Dashboard Theme

The dashboard supports dark mode by default. Customize colors in `packages/web/src/app/globals.css`.

## 🤝 Contributing

Contributions are welcome! Please check [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Fork and clone
git clone <your-fork>
cd website-change-monitor

# Setup
./scripts/quick-setup.sh

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm run dev

# Submit PR
```

## 📊 Tech Stack

- **Backend**: Node.js 20, TypeScript 5.7
- **Frontend**: Next.js 14, React 19, Tailwind CSS
- **Database**: PostgreSQL 16, Drizzle ORM
- **Queue**: BullMQ, Redis 7
- **Browser**: Playwright (Chromium)
- **Deployment**: Docker, Docker Compose

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Star History

If you find this project useful, please consider giving it a star!

## 🙏 Acknowledgments

- Built with modern TypeScript and React
- Inspired by the need for reliable website monitoring
- Made with ❤️ for the open source community

---

<div align="center">

**[⬆ Back to Top](#-website-change-monitor)**

Made with ☕ and 💻

</div>
