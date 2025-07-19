#!/bin/bash

# Troubleshooting script for kernelq.com tunnel issues

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔍 Troubleshooting kernelq.com tunnel${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Function to check status
check_status() {
    local service=$1
    local url=$2
    echo -n "Checking $service... "
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed${NC}"
        return 1
    fi
}

# Function to test DNS
test_dns() {
    local domain=$1
    echo -n "DNS for $domain... "
    
    result=$(nslookup $domain 2>/dev/null | grep -A 10 "Non-authoritative answer:" | grep -E "CNAME|canonical")
    
    if [[ $result == *"cloudflare"* ]]; then
        echo -e "${GREEN}✅ Cloudflare CNAME${NC}"
        return 0
    elif [[ -n $result ]]; then
        echo -e "${YELLOW}⚠️ Other DNS: $result${NC}"
        return 1
    else
        echo -e "${RED}❌ No CNAME found${NC}"
        return 1
    fi
}

echo -e "${YELLOW}📡 1. Local Services Check${NC}"
check_status "Frontend (localhost:3000)" "http://localhost:3000"
check_status "Backend (localhost:3001)" "http://localhost:3001/api/health"

echo ""
echo -e "${YELLOW}🌐 2. DNS Configuration Check${NC}"
test_dns "kernelq.com"
test_dns "www.kernelq.com"
test_dns "api.kernelq.com"

echo ""
echo -e "${YELLOW}🚇 3. Cloudflare Tunnel Status${NC}"

# Check if cloudflared is running
echo -n "Cloudflared process... "
if pgrep -f "cloudflared tunnel run" > /dev/null; then
    echo -e "${GREEN}✅ Running${NC}"
    
    # Show process details
    echo -e "${BLUE}Process details:${NC}"
    ps aux | grep "cloudflared tunnel run" | grep -v grep
else
    echo -e "${RED}❌ Not running${NC}"
fi

echo ""
echo -n "Tunnel configuration... "
if [ -f ~/.cloudflared/config.yml ]; then
    echo -e "${GREEN}✅ Found${NC}"
    echo -e "${BLUE}Configuration:${NC}"
    cat ~/.cloudflared/config.yml
else
    echo -e "${RED}❌ Missing${NC}"
    echo -e "${YELLOW}Run: ./setup-kernelq-tunnel.sh${NC}"
fi

echo ""
echo -e "${YELLOW}📋 4. Tunnel List${NC}"
cloudflared tunnel list 2>/dev/null || echo -e "${RED}❌ Not logged in to Cloudflare${NC}"

echo ""
echo -e "${YELLOW}🌍 5. External Access Test${NC}"
check_status "kernelq.com" "https://kernelq.com"
check_status "api.kernelq.com" "https://api.kernelq.com/api/health"

echo ""
echo -e "${YELLOW}🔧 6. System Resources${NC}"
echo -n "Memory usage... "
mem_usage=$(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')
echo -e "${BLUE}$mem_usage${NC}"

echo -n "Disk usage... "
disk_usage=$(df -h / | tail -1 | awk '{print $5}')
echo -e "${BLUE}$disk_usage${NC}"

echo -n "Network connectivity... "
if ping -c 1 1.1.1.1 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ No internet${NC}"
fi

echo ""
echo -e "${YELLOW}🧪 7. Quick Fixes${NC}"

# Check common issues
issues=()

if ! pgrep -f "cloudflared tunnel run" > /dev/null; then
    issues+=("Tunnel not running")
fi

if [ ! -f ~/.cloudflared/config.yml ]; then
    issues+=("No tunnel config")
fi

if ! curl -s http://localhost:3000 > /dev/null; then
    issues+=("Frontend not running")
fi

if ! curl -s http://localhost:3001/api/health > /dev/null; then
    issues+=("Backend not running")
fi

if [ ${#issues[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ No obvious issues found${NC}"
    echo -e "${BLUE}The problem might be:${NC}"
    echo -e "   • DNS propagation delay (wait 1-5 minutes)"
    echo -e "   • Cloudflare settings need adjustment"
    echo -e "   • Firewall blocking connections"
else
    echo -e "${RED}❌ Found issues:${NC}"
    for issue in "${issues[@]}"; do
        echo -e "   • $issue"
    done
fi

echo ""
echo -e "${YELLOW}💡 Suggested Actions:${NC}"

if [ ! -f ~/.cloudflared/config.yml ]; then
    echo -e "${BLUE}1. Setup tunnel:${NC} ./setup-kernelq-tunnel.sh"
fi

if ! pgrep -f "cloudflared tunnel run" > /dev/null; then
    echo -e "${BLUE}2. Start tunnel manually:${NC} cloudflared tunnel run kernelq-app"
fi

if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${BLUE}3. Start frontend:${NC} cd /home/zerohexer/WebstormProjects/kernel-learning && npm start"
fi

if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${BLUE}4. Start backend:${NC} cd backend && npm start"
fi

echo -e "${BLUE}5. Check Cloudflare dashboard:${NC} https://dash.cloudflare.com"
echo -e "${BLUE}6. Wait for DNS propagation:${NC} 1-5 minutes"
echo -e "${BLUE}7. Test again:${NC} curl -v https://kernelq.com"

echo ""
echo -e "${YELLOW}📞 Need help?${NC}"
echo -e "   🔧 Restart everything: ${CYAN}./start-kernelq.sh${NC}"
echo -e "   📋 Check logs: ${CYAN}journalctl -f${NC}"
echo -e "   🌐 Test locally: ${CYAN}curl http://localhost:3000${NC}"
echo ""