# Bootsliegeplatz Wartelisten-Monitor

A robust 24/7 monitoring system that watches the boat slip waiting list in Konstanz and notifies you immediately via multi-channel notifications when it opens in Q1 2026.

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
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (for production)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Build all packages
npm run build

# Run database migrations
npm run migrate

# Start development servers
npm run dev
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
