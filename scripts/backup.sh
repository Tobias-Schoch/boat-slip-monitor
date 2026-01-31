#!/bin/bash

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "💾 Creating backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
echo "📦 Backing up database..."
if command -v docker-compose &> /dev/null && docker-compose ps | grep -q postgres; then
  docker-compose exec -T postgres pg_dump -U boat_monitor boat_monitor > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
else
  pg_dump boat_monitor > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
fi

# Backup screenshots
echo "📸 Backing up screenshots..."
if [ -d "data/screenshots" ]; then
  tar -czf "$BACKUP_DIR/screenshots_backup_$TIMESTAMP.tar.gz" data/screenshots/
fi

# Backup .env
echo "🔐 Backing up configuration..."
cp .env "$BACKUP_DIR/env_backup_$TIMESTAMP"

echo "✅ Backup complete!"
echo ""
echo "Backup files:"
echo "- Database: $BACKUP_DIR/db_backup_$TIMESTAMP.sql"
echo "- Screenshots: $BACKUP_DIR/screenshots_backup_$TIMESTAMP.tar.gz"
echo "- Config: $BACKUP_DIR/env_backup_$TIMESTAMP"
echo ""
echo "To restore database:"
echo "  psql boat_monitor < $BACKUP_DIR/db_backup_$TIMESTAMP.sql"
echo "To restore screenshots:"
echo "  tar -xzf $BACKUP_DIR/screenshots_backup_$TIMESTAMP.tar.gz"
