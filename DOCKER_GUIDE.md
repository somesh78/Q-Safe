# Quick Start - Building and Running

## Local Testing

```bash
# Build the Docker image
docker-compose build

# Run migrations
docker-compose run --rm web python manage.py migrate

# Start services
docker-compose up

# Access at http://localhost:8000
```

## Environment Setup

Before deployment, copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your production values
```

## Docker Build Process

The Dockerfile uses multi-stage build:

1. **Stage 1 (frontend-builder)**: Builds React app
   - Uses Node.js 18 Alpine
   - Runs `npm run build`
   - Creates optimized production build

2. **Stage 2 (backend)**: Python + Django
   - Copies backend code
   - Copies built React files from stage 1
   - Installs Python dependencies
   - Collects static files
   - Runs Celery + Gunicorn

## Services

- **web**: Django + React (port 8000)
- **redis**: Redis cache/broker (port 6379)

## Volumes

- `redis_data`: Persistent Redis data
- `./backend/logs`: Application logs
- `./backend/storage`: Uploaded files (if not using Supabase)

## Health Checks

- Web: `http://localhost:8000/api/health/`
- Redis: `redis-cli ping`

## Production Notes

- Frontend is served by Django (no separate frontend server needed)
- All API calls go to `/api/*`
- Static files served by WhiteNoise (no Nginx needed for small deployments)
- For high-traffic deployments, add Nginx reverse proxy (see EC2_DEPLOYMENT.md)

## Deployment

See [EC2_DEPLOYMENT.md](EC2_DEPLOYMENT.md) for complete EC2 deployment guide.
