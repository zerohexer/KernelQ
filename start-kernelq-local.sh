#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Kernel Learning locally...${NC}"
echo ""

# Local URLs only
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001/api"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID $CLANGD_PID 2>/dev/null
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

# Set CORS origin for local development
export CORS_ORIGIN="http://localhost:3000"

echo "🌐 Using local URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo "   CORS Origin: $CORS_ORIGIN"

# Start clangd LSP server
echo -e "${BLUE}🧠 Starting clangd LSP server on port 3002...${NC}"
CLANGD_PORT=3002 npm run clangd:start &
CLANGD_PID=$!

# Start backend
echo -e "${BLUE}🔧 Starting backend on localhost:3001...${NC}"
(cd backend && FRONTEND_URL="$FRONTEND_URL" CORS_ORIGIN="$CORS_ORIGIN" npm start) &
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
echo -e "${BLUE}⚛️ Starting frontend...${NC}"
export REACT_APP_BACKEND_URL="$BACKEND_URL"
# Add cache busting for development
export GENERATE_SOURCEMAP=false
export BROWSER=none
# Clear React cache and force fresh start
export FAST_REFRESH=false
export WDS_SOCKET_PORT=0
# Remove any cached files
rm -rf node_modules/.cache 2>/dev/null || true
# Use regular start command for local development
npm start &
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

# Success!
echo ""
echo -e "${GREEN}🎉 Kernel Learning is now running locally!${NC}"
echo ""
echo -e "${BLUE}💻 Local access:${NC}"
echo -e "   🌐 Frontend: ${GREEN}$FRONTEND_URL${NC}"
echo -e "   🔧 Backend:  ${GREEN}$BACKEND_URL${NC}"
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
cat > kernelq_urls_local.txt << EOF
Frontend: $FRONTEND_URL
Backend: $BACKEND_URL
Clangd LSP: ws://localhost:3002
Started: $(date)
API Test: $BACKEND_URL/health
EOF

echo -e "${BLUE}💾 URLs saved to kernelq_urls_local.txt${NC}"
echo ""
echo -e "${GREEN}✨ Your app is now accessible locally!${NC}"
echo -e "${YELLOW}🔗 Open $FRONTEND_URL in your browser${NC}"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running
while true; do
    sleep 1
done