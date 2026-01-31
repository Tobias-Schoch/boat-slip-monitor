#!/bin/bash

set -e

echo "🚀 Setting up Boat Slip Monitor..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from template..."
  cp .env.example .env
  echo "⚠️  Please edit .env with your credentials before continuing"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build packages
echo "🔨 Building packages..."
npm run build

# Start Docker services
echo "🐳 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
npm run migrate

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/screenshots logs

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update .env with your credentials"
echo "2. Start the monitor service: npm run monitor"
echo "3. Start the web dashboard: npm run web"
echo "4. Or start all services with Docker: docker-compose up -d"
