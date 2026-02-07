#!/bin/bash
# Quick start script for KVM-UI development

echo "🚀 KVM-UI Development Server"
echo "=============================="
echo ""

# Kill existing process
echo "⏹️  Stopping any existing server..."
pkill -f "tsx watch src/server.ts" 2>/dev/null || true
sleep 2

# Check .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env with your configuration!"
fi

# Ensure NODE_ENV=development
export NODE_ENV=development

echo "▶️  Starting development server..."
echo "   - Mode: Development (HSTS disabled)"
echo "   - URL: http://localhost:3000"
echo "   - Logs: /tmp/kvm-ui-dev.log"
echo ""

# Start in background
npm run dev > /tmp/kvm-ui-dev.log 2>&1 &

# Wait for startup
sleep 5

# Check if running
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Development server started successfully!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   - Local:  http://localhost:3000"
    echo "   - Public: http://139.99.122.135:3000"
    echo ""
    echo "📋 View logs: tail -f /tmp/kvm-ui-dev.log"
    echo "🛑 Stop server: pkill -f 'tsx watch src/server.ts'"
    echo ""
    echo "⚠️  IMPORTANT: Use HTTP (not HTTPS) in browser!"
    echo ""
else
    echo "❌ Failed to start. Check logs:"
    echo "   tail -50 /tmp/kvm-ui-dev.log"
    exit 1
fi
