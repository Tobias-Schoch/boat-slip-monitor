#!/bin/bash

set -e

echo "🚀 Deploying Boat Slip Monitor (VPS)..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Run ./scripts/setup.sh first"
  exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "✅ Docker installed. Please log out and back in, then run this script again."
  exit 0
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo "❌ Docker Compose not found. Installing..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build images
echo "🔨 Building Docker images..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 15

# Run migrations
echo "🗄️  Running migrations..."
docker-compose exec -T monitor npm run migrate

# Check health
echo "🏥 Checking health..."
curl -f http://localhost:3000/api/health || echo "⚠️  Health check failed"

echo "✅ Deployment complete!"
echo ""
echo "Services running:"
echo "- PostgreSQL: localhost:5432"
echo "- Redis: localhost:6379"
echo "- Monitor Service: Running in container"
echo "- Web Dashboard: http://localhost:3000"
echo ""
echo "Useful commands:"
echo "- View logs: docker-compose logs -f"
echo "- View monitor logs: docker-compose logs -f monitor"
echo "- View web logs: docker-compose logs -f web"
echo "- Restart services: docker-compose restart"
echo "- Stop services: docker-compose down"
echo "- Update: git pull && ./scripts/deploy-vps.sh"
