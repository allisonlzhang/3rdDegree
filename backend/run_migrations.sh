#!/bin/bash
# Run database migrations
cd "$(dirname "$0")"
export PYTHONPATH=.
alembic upgrade head
exit_code=$?
if [ $exit_code -ne 0 ]; then
    echo "Migration failed with exit code $exit_code"
    exit $exit_code
fi
echo "Migrations completed successfully"

