#!/bin/bash

# Boat Slip Monitor v2.0 - Quick Start Script

set -e

echo "🚤 Boat Slip Monitor v2.0 - Quick Start"
echo "======================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

echo "🏗️  Building Docker image (this may take 3-5 minutes)..."
echo ""

docker-compose build

echo ""
echo "🚀 Starting Boat Slip Monitor..."
echo ""

docker-compose up -d

echo ""
echo "⏳ Waiting for service to be healthy..."
sleep 5

# Check health
for i in {1..10}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo ""
        echo "✅ Service is healthy!"
        break
    fi
    echo "   Attempt $i/10..."
    sleep 3
done

echo ""
echo "=========================================="
echo "🎉 Boat Slip Monitor is running!"
echo ""
echo "📊 Dashboard: http://localhost:3000"
echo ""
echo "On first visit, you'll see the setup wizard."
echo "Complete the setup to configure:"
echo "  • Telegram notifications (required)"
echo "  • Email notifications (optional)"
echo "  • Advanced settings (optional)"
echo ""
echo "After setup, the monitor will:"
echo "  ✅ Check 4 German boat slip URLs"
echo "  ✅ Every 3-5 minutes (time-based)"
echo "  ✅ Send notifications on changes"
echo "  ✅ Show live updates in dashboard"
echo ""
echo "📋 View logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
echo ""
echo "=========================================="
