#!/bin/bash

# Start Celery worker in background
celery -A backend worker --loglevel=info &

# Start Gunicorn web server in foreground
gunicorn backend.wsgi:application --bind 0.0.0.0:8000
