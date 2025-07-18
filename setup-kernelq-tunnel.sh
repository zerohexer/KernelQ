#!/bin/bash

# Setup script for kernelq.com cloudflare tunnel
# Run this ONCE to configure your domain with Cloudflare

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🔧 Setting up kernelq.com Cloudflare Tunnel${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared is not installed${NC}"
    echo -e "${YELLOW}Installing cloudflared...${NC}"
    
    # Install cloudflared
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared.deb
    rm cloudflared.deb
    
    echo -e "${GREEN}✅ cloudflared installed${NC}"
fi

echo -e "${BLUE}📋 Tunnel Setup Instructions${NC}"
echo ""
echo -e "${YELLOW}Please follow these steps:${NC}"
echo ""

echo -e "${BLUE}1. Login to Cloudflare${NC}"
echo -e "   Run: ${CYAN}cloudflared tunnel login${NC}"
echo -e "   This will open your browser to authenticate with Cloudflare"
echo ""

echo -e "${BLUE}2. Create a tunnel${NC}"
echo -e "   Run: ${CYAN}cloudflared tunnel create kernelq-app${NC}"
echo -e "   This creates a tunnel named 'kernelq-app'"
echo ""

echo -e "${BLUE}3. Create tunnel configuration${NC}"
echo -e "   I'll create this file for you: ~/.cloudflared/config.yml"
echo ""

# Check if user wants to proceed
read -p "Press Enter to continue with automatic setup, or Ctrl+C to do it manually..."

echo ""
echo -e "${YELLOW}🔑 Step 1: Login to Cloudflare...${NC}"
echo -e "${BLUE}This will open your browser. Please login and authorize cloudflared.${NC}"
echo ""

# Login to cloudflared
cloudflared tunnel login

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to login to Cloudflare${NC}"
    echo -e "${YELLOW}Please run: cloudflared tunnel login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Cloudflare${NC}"
echo ""

echo -e "${YELLOW}🚇 Step 2: Creating tunnel...${NC}"

# Create tunnel
cloudflared tunnel create kernelq-app

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ Tunnel might already exist or there was an error${NC}"
    echo -e "${BLUE}Checking existing tunnels...${NC}"
    cloudflared tunnel list
fi

echo ""
echo -e "${YELLOW}📝 Step 3: Creating configuration file...${NC}"

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep kernelq-app | awk '{print $1}')

if [ -z "$TUNNEL_ID" ]; then
    echo -e "${RED}❌ Could not find tunnel ID${NC}"
    echo -e "${YELLOW}Please check: cloudflared tunnel list${NC}"
    exit 1
fi

echo -e "${BLUE}Found tunnel ID: ${TUNNEL_ID}${NC}"

# Create cloudflared config directory if it doesn't exist
mkdir -p ~/.cloudflared

# Create configuration file
cat > ~/.cloudflared/config.yml << EOF
tunnel: kernelq-app
credentials-file: /home/$USER/.cloudflared/$TUNNEL_ID.json

ingress:
  # Frontend - kernelq.com and www.kernelq.com
  - hostname: kernelq.com
    service: http://localhost:3000
  - hostname: www.kernelq.com
    service: http://localhost:3000
  
  # Backend API - api.kernelq.com
  - hostname: api.kernelq.com
    service: http://localhost:3001
  
  # Catch-all rule (required)
  - service: http_status:404
EOF

echo -e "${GREEN}✅ Configuration file created at ~/.cloudflared/config.yml${NC}"
echo ""

echo -e "${YELLOW}🌐 Step 4: Setting up DNS records...${NC}"
echo -e "${BLUE}Creating CNAME records for your domains...${NC}"

# Create DNS records
cloudflared tunnel route dns kernelq-app kernelq.com
cloudflared tunnel route dns kernelq-app www.kernelq.com
cloudflared tunnel route dns kernelq-app api.kernelq.com

echo -e "${GREEN}✅ DNS records created${NC}"
echo ""

echo -e "${YELLOW}🧪 Step 5: Testing tunnel...${NC}"

# Test the tunnel
echo -e "${BLUE}Starting tunnel test...${NC}"
timeout 10s cloudflared tunnel run kernelq-app &
TEST_PID=$!

sleep 5

# Check if tunnel is running
if pgrep -f "cloudflared tunnel run" > /dev/null; then
    echo -e "${GREEN}✅ Tunnel test successful${NC}"
    kill $TEST_PID 2>/dev/null
else
    echo -e "${RED}❌ Tunnel test failed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Tunnel setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "   🚇 Tunnel name: kernelq-app"
echo -e "   🆔 Tunnel ID: $TUNNEL_ID"
echo -e "   📁 Config file: ~/.cloudflared/config.yml"
echo ""
echo -e "${BLUE}🌐 Your domains:${NC}"
echo -e "   🌐 kernelq.com → localhost:3000 (frontend)"
echo -e "   🌐 www.kernelq.com → localhost:3000 (frontend)"
echo -e "   🔧 api.kernelq.com → localhost:3001 (backend)"
echo ""
echo -e "${YELLOW}⚡ Next steps:${NC}"
echo -e "   1. Wait 1-2 minutes for DNS propagation"
echo -e "   2. Run: ${GREEN}./start-kernelq.sh${NC}"
echo -e "   3. Your app will be live at ${GREEN}https://kernelq.com${NC}"
echo ""
echo -e "${BLUE}🔧 Troubleshooting:${NC}"
echo -e "   📄 View config: ${CYAN}cat ~/.cloudflared/config.yml${NC}"
echo -e "   📋 List tunnels: ${CYAN}cloudflared tunnel list${NC}"
echo -e "   🧪 Test tunnel: ${CYAN}cloudflared tunnel run kernelq-app${NC}"
echo -e "   🌐 Check DNS: ${CYAN}nslookup kernelq.com${NC}"
echo ""