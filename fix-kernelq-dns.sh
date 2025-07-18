#!/bin/bash

# Fix DNS configuration for kernelq.com

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 Fixing kernelq.com DNS Configuration${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if cloudflared is available
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared not found${NC}"
    exit 1
fi

# Get the tunnel ID from the current config
TUNNEL_ID=$(grep "tunnel:" ~/.cloudflared/config.yml | cut -d' ' -f2)

if [ -z "$TUNNEL_ID" ]; then
    echo -e "${RED}❌ Could not find tunnel ID in config${NC}"
    exit 1
fi

echo -e "${BLUE}Found tunnel ID: $TUNNEL_ID${NC}"
echo ""

echo -e "${YELLOW}🔧 Setting up DNS records...${NC}"

# Remove any existing DNS records first (this might fail, that's OK)
echo -e "${BLUE}Cleaning up any existing DNS records...${NC}"
cloudflared tunnel route dns --overwrite-dns $TUNNEL_ID kernelq.com 2>/dev/null
cloudflared tunnel route dns --overwrite-dns $TUNNEL_ID www.kernelq.com 2>/dev/null  
cloudflared tunnel route dns --overwrite-dns $TUNNEL_ID api.kernelq.com 2>/dev/null

echo ""
echo -e "${BLUE}Creating new DNS records...${NC}"

# Create DNS records
echo -n "Creating kernelq.com CNAME... "
if cloudflared tunnel route dns $TUNNEL_ID kernelq.com; then
    echo -e "${GREEN}✅ Created${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

echo -n "Creating www.kernelq.com CNAME... "
if cloudflared tunnel route dns $TUNNEL_ID www.kernelq.com; then
    echo -e "${GREEN}✅ Created${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

echo -n "Creating api.kernelq.com CNAME... "
if cloudflared tunnel route dns $TUNNEL_ID api.kernelq.com; then
    echo -e "${GREEN}✅ Created${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

echo ""
echo -e "${YELLOW}🔍 Verifying DNS setup...${NC}"

# Wait a moment for DNS to propagate
sleep 5

# Check DNS records
echo -n "Checking kernelq.com... "
if nslookup kernelq.com | grep -q "cloudflare"; then
    echo -e "${GREEN}✅ CNAME found${NC}"
else
    echo -e "${YELLOW}⚠️ Still propagating${NC}"
fi

echo -n "Checking api.kernelq.com... "
if nslookup api.kernelq.com | grep -q "cloudflare"; then
    echo -e "${GREEN}✅ CNAME found${NC}"
else
    echo -e "${YELLOW}⚠️ Still propagating${NC}"
fi

echo ""
echo -e "${GREEN}🎉 DNS setup complete!${NC}"
echo ""
echo -e "${YELLOW}⏰ DNS propagation may take 1-5 minutes${NC}"
echo -e "${BLUE}💡 Next steps:${NC}"
echo -e "   1. Wait 2-3 minutes for DNS propagation"
echo -e "   2. Run: ${GREEN}./start-kernelq.sh${NC}"
echo -e "   3. Check: ${GREEN}./troubleshoot-kernelq.sh${NC}"
echo ""
echo -e "${BLUE}🌐 Your domains should point to:${NC}"
echo -e "   kernelq.com → $TUNNEL_ID.cfargotunnel.com"
echo -e "   www.kernelq.com → $TUNNEL_ID.cfargotunnel.com"
echo -e "   api.kernelq.com → $TUNNEL_ID.cfargotunnel.com"
echo ""