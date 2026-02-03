#!/bin/sh
set -e

echo "Running database migrations..."
node packages/database/dist/migrate.js

echo "Starting monitor service..."
exec node packages/monitor/dist/index.js
