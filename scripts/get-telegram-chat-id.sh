#!/bin/bash

set -e

echo "🤖 Telegram Chat ID Finder"
echo "=========================="
echo ""

# Check if token is provided as argument
if [ -n "$1" ]; then
  BOT_TOKEN="$1"
else
  read -p "Enter your Telegram Bot Token: " BOT_TOKEN
fi

if [ -z "$BOT_TOKEN" ]; then
  echo "❌ Error: Bot token is required"
  exit 1
fi

echo ""
echo "📱 Instructions:"
echo "1. Open Telegram on your phone or computer"
echo "2. Search for your bot (the username you created with @BotFather)"
echo "3. Click 'START' or send ANY message to the bot (e.g., 'hello')"
echo "4. Press Enter here when done..."
read

echo ""
echo "🔍 Fetching updates from Telegram..."
echo ""

# Fetch updates from Telegram
RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates")

# Check if response contains updates
if echo "$RESPONSE" | grep -q '"ok":true'; then
  # Extract chat IDs
  CHAT_IDS=$(echo "$RESPONSE" | grep -o '"chat":{"id":[0-9-]*' | grep -o '[0-9-]*$' | sort -u)

  if [ -z "$CHAT_IDS" ]; then
    echo "❌ No messages found!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you sent a message to your bot"
    echo "2. Search for your bot in Telegram and click START"
    echo "3. Send any message (e.g., 'hello')"
    echo "4. Run this script again"
    echo ""
    echo "Raw response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 1
  fi

  echo "✅ Found Chat ID(s):"
  echo ""

  # Count how many chat IDs found
  COUNT=$(echo "$CHAT_IDS" | wc -l)

  if [ "$COUNT" -eq 1 ]; then
    echo "   $CHAT_IDS"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✨ Your Chat ID: $CHAT_IDS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Add this to your .env file:"
    echo "TELEGRAM_CHAT_ID=$CHAT_IDS"
  else
    echo "$CHAT_IDS" | nl
    echo ""
    echo "Multiple chat IDs found. This can happen if:"
    echo "- You sent messages from multiple devices"
    echo "- Multiple people messaged your bot"
    echo ""
    echo "Use the first one (most likely yours)"
    FIRST_ID=$(echo "$CHAT_IDS" | head -1)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✨ Your Chat ID: $FIRST_ID"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Add this to your .env file:"
    echo "TELEGRAM_CHAT_ID=$FIRST_ID"
  fi

  echo ""
  echo "📝 Full response details:"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

else
  echo "❌ Error: Invalid bot token or API error"
  echo ""
  echo "Response:"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "✅ Done! You can now use this Chat ID in your setup."
echo ""
