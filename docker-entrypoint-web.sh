#!/bin/sh
set -e

echo "Running database migrations..."
node packages/database/dist/migrate.js

echo "Starting web service..."
exec npm run start --workspace=@website-monitor/web
