#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏠 Starting Kernel Learning in LOCAL mode...${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    rm -f .env.temp
    echo -e "${GREEN}Services stopped.${NC}"
    exit 0
}

trap cleanup INT

# Ensure we use local API
export REACT_APP_BACKEND_URL=""  # Use default proxy

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

# Start frontend  
echo -e "${BLUE}⚛️ Starting frontend on localhost:3000...${NC}"
npm start &
FRONTEND_PID=$!

# Wait for frontend
echo "⏳ Waiting for frontend to start..."
sleep 6

echo ""
echo -e "${GREEN}✅ Kernel Learning running locally:${NC}"
echo -e "   🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   🔧 Backend:  ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}💡 To share with friends, use: ./start-shared-temp.sh${NC}"
echo ""
echo -e "${RED}Press Ctrl+C to stop both services${NC}"
echo ""

# Keep script running
while true; do
    sleep 1
done