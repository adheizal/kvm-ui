#!/bin/bash
# Quick setup script for KVM-UI v2.0

set -e

echo "🚀 KVM-UI v2.0 Enterprise Setup"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration before continuing!"
    echo "   Required changes:"
    echo "   - SSH_HOST: Your QEMU KVM host IP"
    echo "   - SSH_USER: Your SSH user"
    echo "   - JWT_SECRET: Generate a strong secret"
    echo "   - DB_PASSWORD: Set a secure password"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

echo "🐳 Starting Docker services..."
docker compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
if ! docker compose ps | grep -q "Up"; then
    echo "❌ Failed to start services"
    docker compose logs
    exit 1
fi

echo "🗄️  Running database migrations..."
docker compose exec -T app npm run migrate

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Service URLs:"
echo "   - Web UI:      http://localhost:3000"
echo "   - API Health:  http://localhost:3000/api/health"
echo "   - API Docs:    http://localhost:3000/api/docs (when implemented)"
echo ""
echo "🔐 To create your admin user, run:"
echo "   curl -X POST http://localhost:3000/api/auth/register \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"username\": \"admin\", \"password\": \"your-password\"}'"
echo ""
echo "📝 For more information, see README.md"
echo ""
