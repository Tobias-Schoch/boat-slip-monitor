<div align="center">

# 🔍 Website Change Monitor

**Intelligent 24/7 website monitoring with smart notifications**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

[Features](#-features) •
[Quick Start](#-quick-start) •
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
```

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/Tobias-Schoch/boat-slip-monitor.git
cd boat-slip-monitor

# Run automated setup
./scripts/quick-setup.sh
```

The setup script will automatically:
1. ✅ Create your `.env` file
2. ✅ Start PostgreSQL & Redis
3. ✅ Install dependencies
4. ✅ Build all packages
5. ✅ Run database migrations

### Configure Telegram (2 minutes)

The setup script will guide you, or follow these steps:

1. **Create bot**: Message [@BotFather](https://t.me/botfather) → `/newbot`
2. **Get Chat ID**: Message your bot, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. **Add to `.env`**:
   ```bash
   TELEGRAM_BOT_TOKEN=your_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

### Start Monitoring

```bash
# Terminal 1: Start monitor
npm run monitor

# Terminal 2: Start dashboard
npm run web
```

Open **http://localhost:3000** and add your first URL! 🎉

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

### Configuration

#### Check Interval

Set how often to check URLs:
- Via Dashboard: **Settings** → **Check Interval (minutes)**
- Default: 5 minutes

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

### Adding URLs to Monitor

1. Open dashboard at **http://localhost:3000**
2. Click **"URLs"** tab
3. Click **"Add URL"**
4. Fill in details and save

The monitor will automatically start checking!

## 🐳 Docker Deployment

### Quick Deploy

```bash
# Clone and setup
git clone https://github.com/Tobias-Schoch/boat-slip-monitor.git
cd boat-slip-monitor

# Configure
cp .env.example .env
nano .env  # Add Telegram credentials

# Start everything
docker-compose up -d

# Run migrations
docker-compose exec monitor npm run migrate

# Check status
docker-compose ps
```

### Production (VPS)

```bash
# On your server
git clone https://github.com/Tobias-Schoch/boat-slip-monitor.git
cd boat-slip-monitor

# Configure for production
cp .env.example .env
nano .env  # Set strong passwords and credentials

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

# Verify database
docker-compose exec postgres psql -U website_monitor

# Run migrations
docker-compose exec monitor npm run migrate
```
</details>

<details>
<summary><b>No notifications received</b></summary>

1. Check credentials in **Dashboard → Settings**
2. Verify Telegram bot token is correct
3. Message your bot to activate it
4. Check logs: `docker-compose logs -f monitor | grep notification`
</details>

<details>
<summary><b>Database connection failed</b></summary>

```bash
# Check services
docker-compose ps

# Verify DATABASE_URL in .env matches docker-compose.yml
# Docker: postgresql://website_monitor:password@postgres:5432/website_monitor
# Local:  postgresql://website_monitor:password@localhost:5432/website_monitor
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

Customize HTML email design in `packages/monitor/src/notifier/channels/email.ts`

### Telegram Messages

Customize message formatting in `packages/monitor/src/notifier/channels/telegram.ts`

### Dashboard Theme

The dashboard supports dark mode. Customize colors in `packages/web/src/app/globals.css`

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

```bash
# Fork and clone
git clone https://github.com/Tobias-Schoch/boat-slip-monitor.git
cd boat-slip-monitor

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
