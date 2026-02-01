#!/bin/bash

# Development helper script
# Starts all services in the correct order

echo "🚀 Starting Website Change Monitor (Development Mode)"
echo "====================================================="

# Trap to cleanup on exit
trap 'echo "Stopping services..."; jobs -p | xargs -r kill; exit' INT TERM

# Start infrastructure
echo "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait a bit
sleep 5

# Start monitor in background
echo "Starting monitor service..."
npm run monitor &
MONITOR_PID=$!

# Wait a bit for monitor to initialize
sleep 3

# Start web dashboard
echo "Starting web dashboard..."
echo "Dashboard will be available at http://localhost:3000"
npm run web

# This will keep the script running
wait $MONITOR_PID
