#!/bin/bash
set -eux

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running database migrations..."
# Retry migrations up to 3 times if they fail due to connection issues
max_attempts=3
attempt=1
until python manage.py migrate --noinput; do
    if [ $attempt -eq $max_attempts ]; then
        echo "Migration failed after $max_attempts attempts"
        exit 1
    fi
    echo "Migration attempt $attempt failed, retrying in 5 seconds..."
    attempt=$((attempt + 1))
    sleep 5
done

echo "Cleaning up expired files..."
python manage.py cleanup_expired_files || echo "Cleanup failed, continuing..."

echo "Starting Celery worker in background (single worker for free tier)..."
celery -A backend worker --loglevel=info --concurrency=1 &

echo "Starting Daphne ASGI server..."
# Daphne is the ASGI server for Django Channels (supports HTTP + WebSocket).
# HTTP_TIMEOUT covers large file upload/download requests.
# Pipe to grep to filter out verbose AWS health checks while keeping other logs
daphne -b 0.0.0.0 -p 8000 \
    --http-timeout 18800 \
    backend.asgi:application 2>&1 | grep --line-buffered -v "/api/health/" &

DAPHNE_PID=$!
# Forward termination signals to Daphne for graceful shutdown
trap "kill -TERM $DAPHNE_PID" TERM INT
wait $DAPHNE_PID
