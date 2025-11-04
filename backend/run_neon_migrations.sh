#!/bin/bash
# Run migrations against Neon database
# Set DATABASE_URL environment variable before running:
# export DATABASE_URL="your-neon-connection-string"
# Then run: ./run_neon_migrations.sh

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set!"
    echo "Please set it first:"
    echo "  export DATABASE_URL='your-neon-connection-string'"
    exit 1
fi

export PYTHONPATH=.
echo "Running migrations against Neon database..."
alembic upgrade head
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migrations failed!"
    exit 1
fi
