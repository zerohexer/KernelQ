#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Kernel Learning with kernelq.com...${NC}"
echo ""

# Your custom domain URLs - use same domain for both
FRONTEND_URL="https://kernelq.com"
BACKEND_URL="https://kernelq.com/api"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID $MONITOR_PID $CLANGD_PID 2>/dev/null
    rm -f .env.temp
    echo -e "${GREEN}Cleanup complete.${NC}"
    exit 0
}

trap cleanup INT

# Load OAuth configuration
echo -e "${BLUE}🔧 Loading OAuth configuration...${NC}"
if [ -f .env.kernelq ]; then
    echo "📁 Loading .env.kernelq configuration file..."
    export $(grep -v '^#' .env.kernelq | xargs)
    echo "✅ OAuth configuration loaded from .env.kernelq"
else
    echo "⚠️  .env.kernelq not found, Google SSO will not work"
fi

# Set CORS origin
export CORS_ORIGIN="https://kernelq.com"

echo "🌐 Using URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo "   CORS Origin: $CORS_ORIGIN"

# Start clangd LSP server
echo -e "${BLUE}🧠 Starting clangd LSP server on port 3002...${NC}"
CLANGD_PORT=3002 npm run clangd:start &
CLANGD_PID=$!

# Start backend
echo -e "${BLUE}🔧 Starting backend on localhost:3001...${NC}"
(cd backend && npm start) &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 4

# Check if backend is running
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    cleanup
fi

echo -e "${GREEN}✅ Backend running${NC}"

# Check if clangd LSP server is running
echo "⏳ Checking clangd LSP server..."
sleep 2
if netstat -tuln | grep -q ":3002 "; then
    echo -e "${GREEN}✅ Clangd LSP server running on port 3002${NC}"
else
    echo -e "${YELLOW}⚠️ Clangd LSP server starting...${NC}"
fi

# Start frontend with backend URL
echo -e "${BLUE}⚛️ Starting frontend with backend URL...${NC}"
export REACT_APP_BACKEND_URL="$BACKEND_URL"
# Add cache busting for development
export GENERATE_SOURCEMAP=false
export BROWSER=none
# Clear React cache and force fresh start
export FAST_REFRESH=false
export WDS_SOCKET_PORT=0
# Remove any cached files
rm -rf node_modules/.cache 2>/dev/null || true
# Use current directory instead of hardcoded path
npm run start-tunnel &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 6

# Check if frontend is running
frontend_check=0
for i in {1..10}; do
    if curl -s http://localhost:3000 | grep -q "root\|React" 2>/dev/null; then
        frontend_check=1
        break
    fi
    sleep 1
done

if [ $frontend_check -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Frontend might be slow to start, continuing...${NC}"
else
    echo -e "${GREEN}✅ Frontend running${NC}"
fi

# Start named tunnel (using config file)
echo -e "${BLUE}☁️ Starting kernelq.com tunnel...${NC}"
cloudflared tunnel run kernelq-app &
TUNNEL_PID=$!

# Wait for tunnel to connect
echo "⏳ Waiting for tunnel to establish connection..."
sleep 8

# Test tunnel connectivity (test both frontend and backend)
echo -e "${BLUE}🔍 Testing tunnel connectivity...${NC}"
tunnel_ready=0
api_ready=0

for i in {1..15}; do
    # Test frontend
    if curl -s --max-time 5 "$FRONTEND_URL" > /dev/null 2>&1; then
        tunnel_ready=1
    fi
    
    # Test backend API
    if curl -s --max-time 5 "$BACKEND_URL/health" > /dev/null 2>&1; then
        api_ready=1
    fi
    
    if [ $tunnel_ready -eq 1 ] && [ $api_ready -eq 1 ]; then
        break
    fi
    
    echo -n "."
    sleep 2
done

echo ""

if [ $tunnel_ready -eq 1 ] && [ $api_ready -eq 1 ]; then
    echo -e "${GREEN}✅ Tunnel connected successfully (frontend + API)${NC}"
elif [ $tunnel_ready -eq 1 ]; then
    echo -e "${YELLOW}⚠️ Frontend connected, API still connecting...${NC}"
else
    echo -e "${YELLOW}⚠️ Tunnel might still be connecting, URLs may not be immediately accessible${NC}"
fi

# Success!
echo ""
echo -e "${GREEN}🎉 Kernel Learning is now running on kernelq.com!${NC}"
echo ""
echo -e "${YELLOW}🌐 Your custom domain URLs:${NC}"
echo -e "   🌐 Frontend: ${GREEN}$FRONTEND_URL${NC}"
echo -e "   🔧 Backend:  ${GREEN}$BACKEND_URL${NC}"
echo -e "   🧠 Clangd LSP: ${GREEN}wss://lsp.kernelq.com${NC}"
echo ""
echo -e "${BLUE}💻 Local access:${NC}"
echo -e "   🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   🔧 Backend:  ${GREEN}http://localhost:3001/api${NC}"
echo -e "   🧠 Clangd LSP: ${GREEN}ws://localhost:3002${NC}"
echo ""

# Test the API endpoint specifically
echo -e "${BLUE}🧪 Testing API endpoint...${NC}"
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API endpoint working: $BACKEND_URL/health${NC}"
else
    echo -e "${YELLOW}⚠️ API endpoint not ready yet: $BACKEND_URL/health${NC}"
fi

# Save URLs to file
cat > kernelq_urls.txt << EOF
Frontend: $FRONTEND_URL
Backend: $BACKEND_URL
Clangd LSP: wss://lsp.kernelq.com
Started: $(date)
Local Frontend: http://localhost:3000
Local Backend: http://localhost:3001/api
Local Clangd LSP: ws://localhost:3002
API Test: $BACKEND_URL/health
EOF

echo -e "${BLUE}💾 URLs saved to kernelq_urls.txt${NC}"
echo ""
echo -e "${GREEN}✨ Your app is now accessible at kernelq.com!${NC}"
echo -e "${YELLOW}🔗 Share kernelq.com with anyone - it's your permanent URL!${NC}"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"
echo ""

# Monitor tunnel health
monitor_tunnel() {
    while true; do
        sleep 30
        if ! pgrep -f "cloudflared tunnel run" > /dev/null; then
            echo -e "${RED}⚠️ Tunnel process died, restarting...${NC}"
            cloudflared tunnel run kernelq-app &
            TUNNEL_PID=$!
        fi
    done
}

monitor_tunnel &
MONITOR_PID=$!

# Keep script running
while true; do
    sleep 1
done