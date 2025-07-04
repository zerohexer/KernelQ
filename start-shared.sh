#!/bin/bash

echo "🌐 Starting Kernel Learning in SHARED mode (Cloudflared)..."
echo ""

# Copy tunnel environment
cp .env.tunnel .env

# Start backend
echo "🔧 Starting backend on localhost:3001..."
cd backend && npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend  
echo "⚛️ Starting frontend on localhost:3000..."
cd .. && npm start &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

# Start cloudflared tunnel
echo "☁️ Starting cloudflared tunnels..."
./start-tunnels.sh &
TUNNEL_PID=$!

echo ""
echo "✅ Kernel Learning running with cloudflared:"
echo "   Frontend: https://kernel-frontend.tunnel.com"
echo "   Backend:  https://kernel-backend.tunnel.com" 
echo "   Local Frontend: http://localhost:3000"
echo "   Local Backend:  http://localhost:3001"
echo ""
echo "🔗 Share these URLs with your friends!"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID 2>/dev/null; exit 0" INT

wait