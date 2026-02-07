#!/bin/bash
# Quick restart for development - ensures NODE_ENV=development

echo "🔄 Restarting KVM-UI in development mode..."
echo ""

# Stop services
echo "⏹️  Stopping services..."
docker compose down

# Start with development environment
echo "▶️  Starting services in DEVELOPMENT mode..."
NODE_ENV=development docker compose up -d --build

# Wait for startup
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo ""
echo "💚 Health check:"
curl -s http://localhost:3000/api/health || echo "⚠️  Service not ready yet, wait a few seconds"

echo ""
echo "✅ Restarted in DEVELOPMENT mode (HSTS disabled)"
echo ""
echo "🌐 Access URLs:"
echo "   - http://localhost:3000"
echo "   - http://139.99.122.135:3000"
echo ""
echo "⚠️  Make sure to use HTTP (not HTTPS)!"
echo ""
echo "📋 View logs: docker compose logs -f app"
echo ""
