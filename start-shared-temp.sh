#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Kernel Learning with temporary cloudflared tunnels...${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID $BACKEND_TUNNEL_PID $FRONTEND_TUNNEL_PID 2>/dev/null
    rm -f .env.temp backend_tunnel.log frontend_tunnel.log
    echo -e "${GREEN}Cleanup complete.${NC}"
    exit 0
}

trap cleanup INT

# Start backend
echo -e "${BLUE}🔧 Starting backend on localhost:3001...${NC}"
cd backend && npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 4

# Check if backend is running
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    cleanup
fi

echo -e "${GREEN}✅ Backend running${NC}"

# Start backend tunnel
echo -e "${BLUE}☁️ Creating backend tunnel...${NC}"
cloudflared tunnel --url localhost:3001 > backend_tunnel.log 2>&1 &
BACKEND_TUNNEL_PID=$!

# Wait and extract backend URL
echo "⏳ Waiting for backend tunnel..."
sleep 8

BACKEND_URL=""
for i in {1..10}; do
    BACKEND_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' backend_tunnel.log | head -1)
    if [ -n "$BACKEND_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ Failed to get backend tunnel URL${NC}"
    cleanup
fi

echo -e "${GREEN}✅ Backend tunnel: ${BACKEND_URL}${NC}"

# Start frontend with backend URL
echo -e "${BLUE}⚛️ Starting frontend with backend URL...${NC}"
export REACT_APP_BACKEND_URL="$BACKEND_URL/api"
cd /home/zerohexer/WebstormProjects/kernel-learning
npm run start-tunnel &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 6

# Check if frontend is running (check for React dev server)
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

# Start frontend tunnel
echo -e "${BLUE}☁️ Creating frontend tunnel...${NC}"
cloudflared tunnel --url localhost:3000 > frontend_tunnel.log 2>&1 &
FRONTEND_TUNNEL_PID=$!

# Wait and extract frontend URL
echo "⏳ Waiting for frontend tunnel..."
sleep 8

FRONTEND_URL=""
for i in {1..10}; do
    FRONTEND_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' frontend_tunnel.log | head -1)
    if [ -n "$FRONTEND_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$FRONTEND_URL" ]; then
    echo -e "${RED}❌ Failed to get frontend tunnel URL${NC}"
    cleanup
fi

# Success!
echo ""
echo -e "${GREEN}🎉 Kernel Learning is now running with temporary tunnels!${NC}"
echo ""
echo -e "${YELLOW}📱 Share these URLs with your friends:${NC}"
echo -e "   🌐 Frontend: ${GREEN}$FRONTEND_URL${NC}"
echo -e "   🔧 Backend:  ${GREEN}$BACKEND_URL${NC}"
echo ""
echo -e "${BLUE}💻 Local access:${NC}"
echo -e "   🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   🔧 Backend:  ${GREEN}http://localhost:3001${NC}"
echo ""

# Save URLs to file
cat > tunnel_urls.txt << EOF
Frontend: $FRONTEND_URL
Backend: $BACKEND_URL/api
Started: $(date)
Local Frontend: http://localhost:3000
Local Backend: http://localhost:3001
EOF

echo -e "${BLUE}💾 URLs saved to tunnel_urls.txt${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: These URLs will change every time you restart!${NC}"
echo -e "${YELLOW}⚠️  Keep this terminal open to maintain the tunnels${NC}"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running
while true; do
    sleep 1
done