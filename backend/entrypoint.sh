#!/bin/bash
set -e

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

echo "Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --timeout 300 --workers 1 --max-requests 100 --max-requests-jitter 10
