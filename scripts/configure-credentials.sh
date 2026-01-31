#!/bin/bash

set -e

echo "🔧 Boat Slip Monitor - Credential Configuration"
echo "================================================"
echo ""

# Function to prompt for input with default value
prompt_input() {
  local prompt="$1"
  local default="$2"
  local secret="$3"
  local value

  if [ "$secret" = "true" ]; then
    read -s -p "$prompt: " value
    echo ""
  else
    read -p "$prompt: " value
  fi

  if [ -z "$value" ]; then
    echo "$default"
  else
    echo "$value"
  fi
}

# Function to prompt yes/no
prompt_yn() {
  local prompt="$1"
  local default="$2"
  local response

  read -p "$prompt (y/n) [default: $default]: " response
  response=${response:-$default}

  if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "true"
  else
    echo "false"
  fi
}

# Load existing .env if it exists
if [ -f .env ]; then
  echo "📂 Found existing .env file"
  source .env 2>/dev/null || true
  echo ""
fi

# Backup existing .env
if [ -f .env ]; then
  BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
  cp .env "$BACKUP_FILE"
  echo "💾 Backed up existing .env to: $BACKUP_FILE"
  echo ""
fi

echo "Select what you want to configure:"
echo "1) All credentials (complete reconfiguration)"
echo "2) Telegram only"
echo "3) Email only"
echo "4) SMS/Voice (Twilio) only"
echo "5) Database password only"
echo ""
read -p "Enter your choice (1-5): " choice
echo ""

CONFIGURE_ALL=false
CONFIGURE_TELEGRAM=false
CONFIGURE_EMAIL=false
CONFIGURE_TWILIO=false
CONFIGURE_DB=false

case $choice in
  1)
    CONFIGURE_ALL=true
    ;;
  2)
    CONFIGURE_TELEGRAM=true
    ;;
  3)
    CONFIGURE_EMAIL=true
    ;;
  4)
    CONFIGURE_TWILIO=true
    ;;
  5)
    CONFIGURE_DB=true
    ;;
  *)
    echo "❌ Invalid choice. Exiting."
    exit 1
    ;;
esac

# Database Configuration
if [ "$CONFIGURE_ALL" = "true" ] || [ "$CONFIGURE_DB" = "true" ]; then
  echo "📊 Database Configuration"
  echo "------------------------"
  DB_PASSWORD=$(prompt_input "PostgreSQL password [current: ${POSTGRES_PASSWORD:-changeme}]" "${POSTGRES_PASSWORD:-changeme}" "true")
  echo ""
else
  DB_PASSWORD="${POSTGRES_PASSWORD:-changeme}"
fi

# Telegram Configuration
if [ "$CONFIGURE_ALL" = "true" ] || [ "$CONFIGURE_TELEGRAM" = "true" ]; then
  echo "📱 Telegram Configuration"
  echo "------------------------"
  echo "Current Token: ${TELEGRAM_BOT_TOKEN:0:20}..."
  echo "Current Chat ID: ${TELEGRAM_CHAT_ID}"
  echo ""
  echo "To get Telegram bot token:"
  echo "1. Message @BotFather on Telegram"
  echo "2. Send /newbot and follow instructions"
  echo "3. Copy the bot token"
  echo ""
  TELEGRAM_BOT_TOKEN=$(prompt_input "Telegram Bot Token [press Enter to keep current]" "${TELEGRAM_BOT_TOKEN}" "false")
  echo ""
  echo "To get your Chat ID:"
  echo "1. Message your bot"
  echo "2. Visit: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates"
  echo "3. Find 'chat' -> 'id' in the response"
  echo ""
  TELEGRAM_CHAT_ID=$(prompt_input "Telegram Chat ID [press Enter to keep current]" "${TELEGRAM_CHAT_ID}" "false")
  echo ""
else
  TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
  TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID}"
fi

# Email Configuration
if [ "$CONFIGURE_ALL" = "true" ] || [ "$CONFIGURE_EMAIL" = "true" ]; then
  echo "📧 Email Configuration"
  echo "---------------------"
  if [ ! -z "$SMTP_HOST" ]; then
    echo "Current SMTP Host: ${SMTP_HOST}"
    echo "Current SMTP User: ${SMTP_USER}"
    echo ""
  fi
  SETUP_EMAIL=$(prompt_yn "Configure Email notifications?" "y")
  if [ "$SETUP_EMAIL" = "true" ]; then
    echo ""
    echo "For Gmail, enable 2FA and create an app password:"
    echo "https://myaccount.google.com/apppasswords"
    echo ""
    SMTP_HOST=$(prompt_input "SMTP Host [current: ${SMTP_HOST:-smtp.gmail.com}]" "${SMTP_HOST:-smtp.gmail.com}" "false")
    SMTP_PORT=$(prompt_input "SMTP Port [current: ${SMTP_PORT:-587}]" "${SMTP_PORT:-587}" "false")
    SMTP_SECURE=$(prompt_yn "Use TLS/SSL? [current: ${SMTP_SECURE:-false}]" "${SMTP_SECURE:-n}")
    SMTP_USER=$(prompt_input "SMTP Username [current: ${SMTP_USER}]" "${SMTP_USER}" "false")
    SMTP_PASSWORD=$(prompt_input "SMTP Password (app password) [press Enter to keep current]" "${SMTP_PASSWORD}" "true")
    echo ""
    SMTP_FROM=$(prompt_input "From Email [current: ${SMTP_FROM:-$SMTP_USER}]" "${SMTP_FROM:-$SMTP_USER}" "false")
    SMTP_TO=$(prompt_input "To Email [current: ${SMTP_TO:-$SMTP_USER}]" "${SMTP_TO:-$SMTP_USER}" "false")
  else
    SMTP_HOST=""
    SMTP_PORT="587"
    SMTP_SECURE="false"
    SMTP_USER=""
    SMTP_PASSWORD=""
    SMTP_FROM=""
    SMTP_TO=""
  fi
  echo ""
else
  SMTP_HOST="${SMTP_HOST}"
  SMTP_PORT="${SMTP_PORT:-587}"
  SMTP_SECURE="${SMTP_SECURE:-false}"
  SMTP_USER="${SMTP_USER}"
  SMTP_PASSWORD="${SMTP_PASSWORD}"
  SMTP_FROM="${SMTP_FROM}"
  SMTP_TO="${SMTP_TO}"
fi

# Twilio Configuration
if [ "$CONFIGURE_ALL" = "true" ] || [ "$CONFIGURE_TWILIO" = "true" ]; then
  echo "📞 Twilio Configuration (SMS/Voice)"
  echo "-----------------------------------"
  if [ ! -z "$TWILIO_ACCOUNT_SID" ]; then
    echo "Current Account SID: ${TWILIO_ACCOUNT_SID:0:20}..."
    echo "Current Phone: ${TWILIO_PHONE_NUMBER}"
    echo ""
  fi
  SETUP_TWILIO=$(prompt_yn "Configure SMS/Voice notifications?" "y")
  if [ "$SETUP_TWILIO" = "true" ]; then
    echo ""
    echo "Sign up at https://www.twilio.com"
    echo ""
    TWILIO_ACCOUNT_SID=$(prompt_input "Twilio Account SID [press Enter to keep current]" "${TWILIO_ACCOUNT_SID}" "false")
    TWILIO_AUTH_TOKEN=$(prompt_input "Twilio Auth Token [press Enter to keep current]" "${TWILIO_AUTH_TOKEN}" "true")
    echo ""
    TWILIO_PHONE_NUMBER=$(prompt_input "Twilio Phone Number [current: ${TWILIO_PHONE_NUMBER}]" "${TWILIO_PHONE_NUMBER}" "false")
    TWILIO_TO_PHONE_NUMBER=$(prompt_input "Your Phone Number [current: ${TWILIO_TO_PHONE_NUMBER}]" "${TWILIO_TO_PHONE_NUMBER}" "false")
    ENABLE_VOICE_CALLS=$(prompt_yn "Enable Voice Calls? [current: ${ENABLE_VOICE_CALLS:-false}]" "${ENABLE_VOICE_CALLS:-n}")
  else
    TWILIO_ACCOUNT_SID=""
    TWILIO_AUTH_TOKEN=""
    TWILIO_PHONE_NUMBER=""
    TWILIO_TO_PHONE_NUMBER=""
    ENABLE_VOICE_CALLS="false"
  fi
  echo ""
else
  TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID}"
  TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN}"
  TWILIO_PHONE_NUMBER="${TWILIO_PHONE_NUMBER}"
  TWILIO_TO_PHONE_NUMBER="${TWILIO_TO_PHONE_NUMBER}"
  ENABLE_VOICE_CALLS="${ENABLE_VOICE_CALLS:-false}"
fi

# Keep other settings from existing .env or use defaults
CHECK_INTERVAL="${CHECK_INTERVAL_MINUTES:-5}"
LOG_LEVEL="${LOG_LEVEL:-info}"
NODE_ENV="${NODE_ENV:-development}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD}"
SCREENSHOT_DIR="${SCREENSHOT_DIR:-./data/screenshots}"

# Generate new .env file
echo "💾 Updating .env file..."
cat > .env << EOF
# Database
DATABASE_URL=postgresql://boat_monitor:${DB_PASSWORD}@localhost:5432/boat_monitor
POSTGRES_PASSWORD=${DB_PASSWORD}

# Redis
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}

# Telegram Bot (Required)
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}

# SMTP (Email) - Optional
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_SECURE=${SMTP_SECURE}
SMTP_USER=${SMTP_USER}
SMTP_PASSWORD=${SMTP_PASSWORD}
SMTP_FROM=${SMTP_FROM}
SMTP_TO=${SMTP_TO}

# Twilio (SMS & Voice) - Optional
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
TWILIO_TO_PHONE_NUMBER=${TWILIO_TO_PHONE_NUMBER}

# Application
NODE_ENV=${NODE_ENV}
LOG_LEVEL=${LOG_LEVEL}
SCREENSHOT_DIR=${SCREENSHOT_DIR}

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000

# Monitoring
CHECK_INTERVAL_MINUTES=${CHECK_INTERVAL}
ENABLE_VOICE_CALLS=${ENABLE_VOICE_CALLS}
EOF

echo "✅ Configuration updated successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Configuration Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "✓ Telegram:        Configured"
else
  echo "✗ Telegram:        Not configured (REQUIRED!)"
fi

if [ ! -z "$SMTP_HOST" ]; then
  echo "✓ Email:           Configured"
else
  echo "○ Email:           Not configured (optional)"
fi

if [ ! -z "$TWILIO_ACCOUNT_SID" ]; then
  echo "✓ SMS/Voice:       Configured"
  if [ "$ENABLE_VOICE_CALLS" = "true" ]; then
    echo "  Voice Calls:     Enabled"
  else
    echo "  Voice Calls:     Disabled"
  fi
else
  echo "○ SMS/Voice:       Not configured (optional)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔄 Next Steps:"
echo ""
echo "1. Restart services to apply changes:"
echo "   - If using PM2:     pm2 restart all"
echo "   - If using Docker:  docker-compose restart"
echo "   - If manual:        Stop and restart npm run monitor"
echo ""
echo "2. Test your notifications:"
echo "   ./scripts/test-notification.sh telegram"
if [ ! -z "$SMTP_HOST" ]; then
  echo "   ./scripts/test-notification.sh email"
fi
if [ ! -z "$TWILIO_ACCOUNT_SID" ]; then
  echo "   ./scripts/test-notification.sh sms"
fi
echo ""
echo "💾 Backup saved to: $BACKUP_FILE"
echo ""
