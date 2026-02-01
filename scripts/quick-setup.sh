#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis
ROCKET="🚀"
CHECK="✅"
CROSS="❌"
INFO="ℹ️"
PACKAGE="📦"
HAMMER="🔨"
DATABASE="🗃️"
DOCKER="🐳"
HOURGLASS="⏳"

echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║     ${ROCKET}  Website Change Monitor Setup  ${ROCKET}       ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
echo -e "${CYAN}${INFO} Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}${CROSS} Docker not found${NC}"
    echo -e "   Install from ${BLUE}https://docker.com${NC}"
    exit 1
fi
echo -e "${GREEN}${CHECK} Docker found${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}${CROSS} Node.js not found${NC}"
    echo -e "   Install from ${BLUE}https://nodejs.org${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}${CHECK} Node.js ${NODE_VERSION} found${NC}"

# Create .env
echo ""
echo -e "${CYAN}${INFO} Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}${CHECK} Created .env file${NC}"
else
    echo -e "${YELLOW}${INFO} .env already exists${NC}"
fi

# Start infrastructure
echo ""
echo -e "${CYAN}${DOCKER} Starting Docker services...${NC}"
docker-compose up -d postgres redis
sleep 2

# Show service status with colors
echo ""
if docker-compose ps | grep -q "healthy"; then
    echo -e "${GREEN}${CHECK} Docker services started${NC}"
else
    echo -e "${YELLOW}${HOURGLASS} Waiting for services to be healthy...${NC}"
    sleep 10
fi

# Install dependencies
echo ""
echo -e "${CYAN}${PACKAGE} Installing dependencies...${NC}"
npm install --silent
echo -e "${GREEN}${CHECK} Dependencies installed${NC}"

# Build packages
echo ""
echo -e "${CYAN}${HAMMER} Building packages...${NC}"
npm run build --silent
echo -e "${GREEN}${CHECK} Build complete${NC}"

# Run migrations
echo ""
echo -e "${CYAN}${DATABASE} Running database migrations...${NC}"
npm run migrate
echo -e "${GREEN}${CHECK} Database ready${NC}"

# Success message
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║        ${CHECK}  Setup Complete!  ${CHECK}                  ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}${INFO} Next steps:${NC}"
echo -e ""
echo -e "  ${YELLOW}1.${NC} Configure Telegram bot in ${BLUE}.env${NC}"
echo -e "     ${PURPLE}TELEGRAM_BOT_TOKEN${NC}=your_token"
echo -e "     ${PURPLE}TELEGRAM_CHAT_ID${NC}=your_chat_id"
echo -e ""
echo -e "  ${YELLOW}2.${NC} Start the monitor:"
echo -e "     ${GREEN}npm run monitor${NC}"
echo -e ""
echo -e "  ${YELLOW}3.${NC} Start the dashboard (new terminal):"
echo -e "     ${GREEN}npm run web${NC}"
echo -e ""
echo -e "  ${YELLOW}4.${NC} Open ${BLUE}http://localhost:3000${NC}"
echo -e ""
echo -e "${PURPLE}Need help? Check the README.md${NC}"
echo ""
