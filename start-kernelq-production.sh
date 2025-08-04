#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting KernelQ Production with Lima Database...${NC}"
echo ""

# Your custom domain URLs - use same domain for both
FRONTEND_URL="https://kernelq.com"
BACKEND_URL="https://kernelq.com/api"

# Database preference: Lima first, local fallback
USE_LIMA_DB=true
LIMA_VM_NAME="kernelq-dev"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID $MONITOR_PID 2>/dev/null
    rm -f .env.temp
    echo -e "${GREEN}Cleanup complete.${NC}"
    exit 0
}

trap cleanup INT

# Function to check Lima VM status
check_lima_status() {
    echo -e "${PURPLE}🏔️ Checking Lima VM status...${NC}"
    
    # Check if Lima VM exists and is running
    if ! limactl list | grep -q "$LIMA_VM_NAME"; then
        echo -e "${YELLOW}⚠️ Lima VM '$LIMA_VM_NAME' not found${NC}"
        return 1
    fi
    
    local lima_status=$(limactl list | grep "$LIMA_VM_NAME" | awk '{print $2}')
    
    if [ "$lima_status" = "Running" ]; then
        echo -e "${GREEN}✅ Lima VM is running${NC}"
        return 0
    elif [ "$lima_status" = "Stopped" ]; then
        echo -e "${YELLOW}⚠️ Lima VM is stopped, attempting to start...${NC}"
        if limactl start "$LIMA_VM_NAME"; then
            echo -e "${GREEN}✅ Lima VM started successfully${NC}"
            sleep 3  # Give Lima time to fully initialize
            return 0
        else
            echo -e "${RED}❌ Failed to start Lima VM${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Lima VM is in '$lima_status' state${NC}"
        return 1
    fi
}

# Function to test Lima database accessibility
test_lima_database() {
    echo -e "${PURPLE}🏔️ Testing Lima database accessibility...${NC}"
    
    # Test if we can access the database from within Lima
    if limactl shell "$LIMA_VM_NAME" -- sh -c 'test -f /home/zerohexer.linux/kernelq-data/db/kernelq.db'; then
        echo -e "${GREEN}✅ Lima database accessible${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Lima database not accessible${NC}"
        return 1
    fi
}

# Function to start backend in Lima
start_lima_backend() {
    echo -e "${PURPLE}🏔️ Starting backend in Lima VM...${NC}"
    
    # Start backend inside Lima VM
    limactl shell "$LIMA_VM_NAME" -- sh -c "
        cd /home/zerohexer/WebstormProjects/KernelOne-main/backend
        export CORS_ORIGIN='https://kernelq.com'
        echo '🏔️ Backend starting with Lima database...'
        npm start
    " &
    BACKEND_PID=$!
    
    echo -e "${GREEN}✅ Backend started in Lima VM (PID: $BACKEND_PID)${NC}"
}

# Function to start backend locally
start_local_backend() {
    echo -e "${BLUE}🔧 Starting backend locally (fallback mode)...${NC}"
    
    export CORS_ORIGIN="https://kernelq.com"
    (cd backend && npm start) &
    BACKEND_PID=$!
    
    echo -e "${GREEN}✅ Backend started locally (PID: $BACKEND_PID)${NC}"
}

# Main database selection logic
echo -e "${PURPLE}🎯 Production Database Selection:${NC}"
echo -e "   Priority 1: Lima VM database"
echo -e "   Priority 2: Local database (fallback)"
echo ""

if [ "$USE_LIMA_DB" = true ]; then
    if check_lima_status && test_lima_database; then
        echo -e "${GREEN}🏔️ Using Lima database (production mode)${NC}"
        start_lima_backend
    else
        echo -e "${YELLOW}⚠️ Lima unavailable, falling back to local database${NC}"
        start_local_backend
    fi
else
    echo -e "${BLUE}📍 Using local database (fallback mode)${NC}"
    start_local_backend
fi

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 6

# Check if backend is running
backend_ready=0
for i in {1..10}; do
    if curl -s http://localhost:3001/api/health > /dev/null; then
        backend_ready=1
        break
    fi
    echo -n "."
    sleep 1
done

echo ""

if [ $backend_ready -eq 0 ]; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    cleanup
fi

echo -e "${GREEN}✅ Backend running and healthy${NC}"

# Start frontend with backend URL
echo -e "${BLUE}⚛️ Starting frontend...${NC}"
export REACT_APP_BACKEND_URL="$BACKEND_URL"
export GENERATE_SOURCEMAP=false
export BROWSER=none
export FAST_REFRESH=false
export WDS_SOCKET_PORT=0

# Remove any cached files
rm -rf node_modules/.cache 2>/dev/null || true

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

# Start named tunnel
echo -e "${BLUE}☁️ Starting kernelq.com tunnel...${NC}"
cloudflared tunnel run kernelq-app &
TUNNEL_PID=$!

# Wait for tunnel to connect
echo "⏳ Waiting for tunnel to establish connection..."
sleep 8

# Test tunnel connectivity
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
echo -e "${GREEN}🎉 KernelQ Production is now running!${NC}"
echo ""

# Show database status
echo -e "${PURPLE}💾 Database Status:${NC}"
if pgrep -f "limactl shell.*npm start" > /dev/null; then
    echo -e "   🏔️ Using Lima database (production)"
    echo -e "   📁 Path: /home/zerohexer.linux/kernelq-data/db/kernelq.db"
else
    echo -e "   📍 Using local database (fallback)"
    echo -e "   📁 Path: $(pwd)/backend/kernelq.db"
fi
echo ""

echo -e "${YELLOW}🌐 Your production URLs:${NC}"
echo -e "   🌐 Frontend: ${GREEN}$FRONTEND_URL${NC}"
echo -e "   🔧 Backend:  ${GREEN}$BACKEND_URL${NC}"
echo ""
echo -e "${BLUE}💻 Local development access:${NC}"
echo -e "   🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   🔧 Backend:  ${GREEN}http://localhost:3001/api${NC}"
echo ""

# Test the API endpoint specifically
echo -e "${BLUE}🧪 Testing API endpoint...${NC}"
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API endpoint working: $BACKEND_URL/health${NC}"
else
    echo -e "${YELLOW}⚠️ API endpoint not ready yet: $BACKEND_URL/health${NC}"
fi

# Save URLs to file with database info
cat > kernelq_urls.txt << EOF
Frontend: $FRONTEND_URL
Backend: $BACKEND_URL
Started: $(date)
Local Frontend: http://localhost:3000
Local Backend: http://localhost:3001/api
API Test: $BACKEND_URL/health
Database: $(pgrep -f "limactl shell.*npm start" > /dev/null && echo "Lima (production)" || echo "Local (fallback)")
EOF

echo -e "${BLUE}💾 URLs and status saved to kernelq_urls.txt${NC}"
echo ""
echo -e "${GREEN}✨ KernelQ is live at kernelq.com!${NC}"
echo -e "${YELLOW}🔗 Production-ready with automatic database fallback${NC}"
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