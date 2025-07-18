#!/bin/bash

# Quick deployment verification script for kernelq.com
# Run this after deployment to ensure everything is working

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="kernelq.com"

echo -e "${BLUE}🔍 KernelOne Deployment Verification for ${DOMAIN}${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    local expected_code=${3:-200}
    
    echo -n "Checking $name ($url)... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✅ OK ($response)${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed ($response)${NC}"
        return 1
    fi
}

# Function to check SSL
check_ssl() {
    local domain=$1
    echo -n "Checking SSL for $domain... "
    
    if openssl s_client -connect "$domain:443" -servername "$domain" </dev/null 2>/dev/null | openssl x509 -noout -dates >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Valid SSL${NC}"
        return 0
    else
        echo -e "${RED}❌ SSL Issue${NC}"
        return 1
    fi
}

# Main checks
echo -e "${YELLOW}📱 Frontend Checks${NC}"
check_url "https://${DOMAIN}" "Main site"
check_url "https://www.${DOMAIN}" "WWW redirect" 301
check_ssl "${DOMAIN}"

echo ""
echo -e "${YELLOW}🔧 Backend API Checks${NC}"
check_url "https://api.${DOMAIN}/api/health" "Health endpoint"
check_url "https://api.${DOMAIN}/api/problems" "Problems endpoint"
check_ssl "api.${DOMAIN}"

echo ""
echo -e "${YELLOW}🔒 Security Checks${NC}"
check_url "http://${DOMAIN}" "HTTP redirect" 301
check_url "http://api.${DOMAIN}" "API HTTP redirect" 301

echo ""
echo -e "${YELLOW}🖥️ Server Status${NC}"

# Check if running on server
if command -v pm2 >/dev/null 2>&1; then
    echo -n "PM2 Backend Status... "
    if pm2 show kernelone-backend >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${RED}❌ Not running${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ PM2 not found (not running on server?)${NC}"
fi

if command -v systemctl >/dev/null 2>&1; then
    echo -n "Nginx Status... "
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${RED}❌ Stopped${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ systemctl not found${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Performance Check${NC}"

# Check response times
echo -n "Frontend response time... "
time_frontend=$(curl -s -o /dev/null -w "%{time_total}" "https://${DOMAIN}")
if (( $(echo "$time_frontend < 3.0" | bc -l) )); then
    echo -e "${GREEN}✅ ${time_frontend}s${NC}"
else
    echo -e "${YELLOW}⚠️ ${time_frontend}s (slow)${NC}"
fi

echo -n "API response time... "
time_api=$(curl -s -o /dev/null -w "%{time_total}" "https://api.${DOMAIN}/api/health")
if (( $(echo "$time_api < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ ${time_api}s${NC}"
else
    echo -e "${YELLOW}⚠️ ${time_api}s (slow)${NC}"
fi

echo ""
echo -e "${YELLOW}🔍 Content Verification${NC}"

# Check if React app is loading
echo -n "React app loading... "
if curl -s "https://${DOMAIN}" | grep -q "react\|React\|root" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ React detected${NC}"
else
    echo -e "${RED}❌ React not detected${NC}"
fi

# Check API response
echo -n "API JSON response... "
if curl -s "https://api.${DOMAIN}/api/health" | grep -q "status\|health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Valid JSON${NC}"
else
    echo -e "${RED}❌ Invalid response${NC}"
fi

echo ""
echo -e "${BLUE}📋 Summary${NC}"

# Final verdict
echo -n "Overall status: "
if check_url "https://${DOMAIN}" "silent" >/dev/null 2>&1 && check_url "https://api.${DOMAIN}/api/health" "silent" >/dev/null 2>&1; then
    echo -e "${GREEN}🎉 Deployment looks good!${NC}"
    echo ""
    echo -e "${GREEN}✅ Frontend: https://${DOMAIN}${NC}"
    echo -e "${GREEN}✅ API: https://api.${DOMAIN}${NC}"
    echo ""
    echo -e "${BLUE}🚀 KernelOne is ready for students!${NC}"
else
    echo -e "${RED}❌ Issues detected${NC}"
    echo ""
    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
    echo -e "   📖 Check deployment guide: cat DEPLOYMENT-GUIDE.md"
    echo -e "   📄 Check logs: pm2 logs kernelone-backend"
    echo -e "   🔧 Monitor: ./monitor.sh"
    echo -e "   🌐 Check DNS: nslookup ${DOMAIN}"
fi

echo ""