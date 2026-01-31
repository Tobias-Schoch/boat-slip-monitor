#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/test-notification.sh [telegram|email|sms|voice]"
  exit 1
fi

CHANNEL=$1

echo "🧪 Testing $CHANNEL notification..."

curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"$CHANNEL\",
    \"priority\": \"CRITICAL\",
    \"title\": \"Test Notification\",
    \"message\": \"This is a test notification from Boat Slip Monitor\"
  }"

echo ""
echo "✅ Test notification sent. Check your $CHANNEL for the message."
