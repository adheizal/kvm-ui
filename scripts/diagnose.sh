#!/bin/bash
# Diagnostic script for KVM-UI

echo "🔍 KVM-UI Diagnostics"
echo "===================="
echo ""

# Check Docker
echo "📦 Docker Containers:"
docker compose ps
echo ""

# Check health
echo "💚 Health Check:"
curl -s http://localhost:3000/api/health || echo "❌ Health check failed"
echo ""
echo ""

# Check detailed health
echo "💚 Detailed Health:"
curl -s http://localhost:3000/api/health/detailed | head -20
echo ""
echo ""

# Check logs
echo "📋 Recent Logs (last 10 lines):"
docker compose logs --tail=10 app
echo ""

# Environment check
echo "🔧 Environment Variables:"
docker compose exec app env 2>/dev/null | grep -E "NODE_ENV|PORT|SSH_HOST|DB_HOST|REDIS_HOST" | sort || echo "Container not running"
echo ""

echo "✅ Diagnostics complete!"
echo ""
echo "📝 Quick fixes:"
echo "  - If ERR_SSL_PROTOCOL_ERROR: Clear browser HSTS data"
echo "  - If can't login: Check browser console (F12)"
echo "  - If connection fails: Check firewall and port 3000"
echo ""
echo "🌐 Access URLs:"
echo "  - HTTP:  http://localhost:3000"
echo "  - HTTP:  http://$(hostname -I | awk '{print $1}'):3000"
echo "  - Health: http://localhost:3000/api/health"
echo ""
