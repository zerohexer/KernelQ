#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Kernel Learning Production with kernelq.com...${NC}"
echo ""

# Your custom domain URLs
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

# Set CORS origin and production environment
export CORS_ORIGIN="https://kernelq.com"
export NODE_ENV=production

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

# Build production frontend (removes console.log automatically)
echo -e "${BLUE}📦 Building production frontend...${NC}"
npm run build

# Inject console override into built index.html
echo -e "${BLUE}🔧 Disabling browser console logs...${NC}"
sed -i 's/<head>/<head><script>if(typeof console!=="undefined"){console.log=function(){};console.error=function(){};console.debug=function(){};console.warn=function(){};console.info=function(){};}<\/script>/' build/index.html 2>/dev/null

# Serve production build
echo -e "${BLUE}⚛️ Starting production frontend server...${NC}"
export REACT_APP_BACKEND_URL="$BACKEND_URL"
npx serve -s build -l 3000 &
FRONTEND_PID=$!

# Wait for frontend
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
    echo -e "${GREEN}✅ Production frontend running${NC}"
fi

# Start tunnel
echo -e "${BLUE}☁️ Starting kernelq.com tunnel...${NC}"
cloudflared tunnel run kernelq-app &
TUNNEL_PID=$!

# Wait for tunnel
echo "⏳ Waiting for tunnel to establish connection..."
sleep 8

# Test connectivity
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

# Monitor tunnel health (silent)
monitor_tunnel() {
    while true; do
        sleep 30
        pgrep -f "cloudflared tunnel run" >/dev/null || {
            cloudflared tunnel run kernelq-app >/dev/null 2>&1 &
            TUNNEL_PID=$!
        }
    done
}

monitor_tunnel &
MONITOR_PID=$!

# Keep script running
while true; do
    sleep 1
done
