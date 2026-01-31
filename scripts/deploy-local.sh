#!/bin/bash

set -e

echo "🚀 Deploying Boat Slip Monitor (Local)..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Run ./scripts/setup.sh first"
  exit 1
fi

# Build packages
echo "🔨 Building packages..."
npm run build

# Start Docker services
echo "🐳 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for services
echo "⏳ Waiting for services..."
sleep 5

# Run migrations
echo "🗄️  Running migrations..."
npm run migrate

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2..."
  npm install -g pm2
fi

# Stop existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 stop boat-monitor-service 2>/dev/null || true
pm2 stop boat-monitor-web 2>/dev/null || true
pm2 delete boat-monitor-service 2>/dev/null || true
pm2 delete boat-monitor-web 2>/dev/null || true

# Start services with PM2
echo "🚀 Starting services..."
pm2 start packages/monitor/dist/index.js --name boat-monitor-service
pm2 start npm --name boat-monitor-web -- run start --workspace=@boat-monitor/web

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "Services running:"
echo "- Monitor Service: PM2 (boat-monitor-service)"
echo "- Web Dashboard: http://localhost:3000 (boat-monitor-web)"
echo ""
echo "Useful commands:"
echo "- View logs: pm2 logs"
echo "- Monitor: pm2 monit"
echo "- Restart: pm2 restart all"
echo "- Stop: pm2 stop all"
