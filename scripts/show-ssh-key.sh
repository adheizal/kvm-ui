#!/bin/bash

# Script to display the SSH public key from the Docker container

echo "========================================"
echo "KVM-UI SSH Public Key"
echo "========================================"
echo ""
echo "Add this key to your KVM host's ~/.ssh/authorized_keys:"
echo ""

# Try to get from running container
if docker compose ps app | grep -q "Up"; then
    echo "From running container:"
    docker compose exec -T app cat /app/.ssh/id_ed25519.pub
else
    echo "Container not running. Getting from Docker image:"
    docker run --rm kvm-ui-app cat /app/.ssh/id_ed25519.pub
fi

echo ""
echo "========================================"
echo "Instructions:"
echo "1. Login to your KVM host"
echo "2. Run: mkdir -p ~/.ssh"
echo "3. Run: echo '<PUBLIC_KEY_ABOVE>' >> ~/.ssh/authorized_keys"
echo "4. Run: chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
echo "========================================"
