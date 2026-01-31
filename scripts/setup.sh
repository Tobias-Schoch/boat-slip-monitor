#!/bin/bash

set -e

echo "🚀 Setting up Boat Slip Monitor..."
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

# Check if .env already exists
if [ -f .env ]; then
  echo "⚠️  .env file already exists!"
  read -p "Do you want to overwrite it? (y/n): " overwrite
  if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
    echo "Keeping existing .env file. Continuing with setup..."
    SKIP_ENV_SETUP=true
  fi
fi

if [ "$SKIP_ENV_SETUP" != "true" ]; then
  echo "📝 Interactive .env Configuration"
  echo "=================================="
  echo ""
  echo "Press Enter to skip optional fields (they will be added as empty values)"
  echo ""

  # Database Configuration
  echo "📊 Database Configuration"
  echo "------------------------"
  DB_PASSWORD=$(prompt_input "PostgreSQL password [default: changeme]" "changeme" "true")
  echo ""

  # Telegram Configuration (Required)
  echo "📱 Telegram Configuration (REQUIRED for notifications)"
  echo "------------------------------------------------------"
  echo ""
  echo "Step 1: Create your Telegram bot"
  echo "  1. Open Telegram and search for @BotFather"
  echo "  2. Send: /newbot"
  echo "  3. Follow instructions to create your bot"
  echo "  4. Copy the bot token (looks like: 123456789:ABCdefGHI...)"
  echo ""
  TELEGRAM_BOT_TOKEN=$(prompt_input "Telegram Bot Token" "" "false")

  if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "⚠️  Warning: Telegram token is required for notifications!"
    echo "You can add it later by editing .env or running ./scripts/configure-credentials.sh"
    TELEGRAM_CHAT_ID=""
  else
    echo ""
    echo "Step 2: Get your Chat ID"
    echo ""
    USE_HELPER=$(prompt_yn "Do you want to use our helper script to get your Chat ID?" "y")

    if [ "$USE_HELPER" = "true" ]; then
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "📱 IMPORTANT: Before continuing!"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      echo "1. Open Telegram on your phone or computer"
      echo "2. Search for your bot username"
      echo "3. Click START (or send any message like 'hello')"
      echo "4. Then come back here and press Enter"
      echo ""
      read -p "Press Enter when you've sent a message to your bot..."
      echo ""

      # Run the helper script
      CHAT_ID_RESULT=$(bash scripts/get-telegram-chat-id.sh "$TELEGRAM_BOT_TOKEN" 2>&1 | grep "Your Chat ID:" | cut -d: -f2 | tr -d ' ')

      if [ -n "$CHAT_ID_RESULT" ]; then
        TELEGRAM_CHAT_ID="$CHAT_ID_RESULT"
        echo "✅ Chat ID found: $TELEGRAM_CHAT_ID"
      else
        echo ""
        echo "⚠️  Couldn't automatically find your Chat ID."
        echo ""
        echo "Manual method:"
        echo "  1. Make sure you sent a message to your bot"
        echo "  2. Visit this URL in your browser:"
        echo "     https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates"
        echo "  3. Look for \"chat\":{\"id\":NUMBERS"
        echo "  4. Copy those numbers"
        echo ""
        TELEGRAM_CHAT_ID=$(prompt_input "Enter your Chat ID (or press Enter to skip)" "" "false")
      fi
    else
      echo ""
      echo "Manual method to get Chat ID:"
      echo "  1. Open Telegram and send a message to your bot"
      echo "  2. Visit this URL in your browser:"
      echo "     https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates"
      echo "  3. Look for \"chat\":{\"id\":NUMBERS"
      echo "  4. Copy those numbers (e.g., 123456789)"
      echo ""
      echo "Common issues:"
      echo "  - Empty result []? → You haven't messaged your bot yet!"
      echo "  - Make sure to click START in your bot chat first"
      echo ""
      TELEGRAM_CHAT_ID=$(prompt_input "Telegram Chat ID" "" "false")
    fi
  fi
  echo ""

  # Email Configuration (Optional)
  SETUP_EMAIL=$(prompt_yn "Do you want to configure Email notifications?" "n")
  if [ "$SETUP_EMAIL" = "true" ]; then
    echo ""
    echo "📧 Email Configuration (Optional)"
    echo "---------------------------------"
    echo "For Gmail, enable 2FA and create an app password:"
    echo "https://myaccount.google.com/apppasswords"
    echo ""
    SMTP_HOST=$(prompt_input "SMTP Host [default: smtp.gmail.com]" "smtp.gmail.com" "false")
    SMTP_PORT=$(prompt_input "SMTP Port [default: 587]" "587" "false")
    SMTP_SECURE=$(prompt_yn "Use TLS/SSL?" "n")
    SMTP_USER=$(prompt_input "SMTP Username (email)" "" "false")
    SMTP_PASSWORD=$(prompt_input "SMTP Password (app password)" "" "true")
    echo ""
    SMTP_FROM=$(prompt_input "From Email" "$SMTP_USER" "false")
    SMTP_TO=$(prompt_input "To Email (recipient)" "$SMTP_USER" "false")
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

  # Application Configuration
  echo "⚙️  Application Configuration"
  echo "----------------------------"
  CHECK_INTERVAL=$(prompt_input "Check interval in minutes [default: 5]" "5" "false")
  LOG_LEVEL=$(prompt_input "Log level (info/debug/warn/error) [default: info]" "info" "false")
  NODE_ENV=$(prompt_input "Environment (development/production) [default: development]" "development" "false")
  echo ""

  # Generate .env file
  echo "💾 Generating .env file..."
  cat > .env << EOF
# Database
DATABASE_URL=postgresql://boat_monitor:${DB_PASSWORD}@localhost:5432/boat_monitor
POSTGRES_PASSWORD=${DB_PASSWORD}

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

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

# Application
NODE_ENV=${NODE_ENV}
LOG_LEVEL=${LOG_LEVEL}
SCREENSHOT_DIR=./data/screenshots

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000

# Monitoring
CHECK_INTERVAL_MINUTES=${CHECK_INTERVAL}
EOF

  echo "✅ .env file created successfully!"
  echo ""
fi

# Validate required credentials
if [ "$SKIP_ENV_SETUP" != "true" ]; then
  if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "⚠️  WARNING: Telegram credentials are required for notifications!"
    echo "You can add them later by editing the .env file"
    echo ""
  fi
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

echo ""
echo "✅ Setup complete!"
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

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Review your configuration:"
echo "   cat .env"
echo ""
echo "2. Start the monitor service:"
echo "   npm run monitor"
echo ""
echo "3. In another terminal, start the web dashboard:"
echo "   npm run web"
echo ""
echo "4. Access the dashboard:"
echo "   http://localhost:3000"
echo ""
echo "5. Test notifications:"
echo "   ./scripts/test-notification.sh telegram"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide:        SETUP.md"
echo "   - Architecture:       ARCHITECTURE.md"
echo "   - README:             README.md"
echo ""
echo "💡 Tip: You can always edit .env manually to update credentials"
echo ""
