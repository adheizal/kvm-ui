#!/bin/bash
# Migration helper script

set -e

echo "Running database migrations..."

if [ -n "$DB_HOST" ] && [ "$DB_HOST" != "localhost" ]; then
    echo "Running migrations in Docker container..."
    docker compose exec app npm run migrate
else
    echo "Running migrations locally..."
    npm run migrate
fi

echo "Migrations completed successfully!"
