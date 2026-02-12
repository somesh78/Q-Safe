# Q-Safe EC2 Deployment Guide

Complete guide to deploy Q-Safe on AWS EC2 with Docker.

## Prerequisites

- AWS EC2 instance (Ubuntu 22.04 LTS recommended)
- Minimum 2GB RAM, 2 vCPU
- PostgreSQL database (RDS or local)
- Supabase account for file storage
- Domain name (optional, but recommended)

## Step 1: Setup EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (optional)
sudo usermod -aG docker $USER
newgrp docker
```

## Step 2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/your-username/Q-Safe.git
cd Q-Safe
```

## Step 3: Configure Environment Variables

```bash
# Copy example and edit .env file
cp .env.example .env
nano .env
```

**Required Environment Variables:**

```env
# Django
SECRET_KEY=your-very-secure-random-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-ec2-ip,your-domain.com,www.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Database (PostgreSQL recommended)
DATABASE_URL=postgresql://username:password@database-host:5432/q_safe

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_BUCKET=q-safe-files

# Redis (will be created by docker-compose)
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

**Generate SECRET_KEY:**
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Step 4: Setup Frontend Environment

```bash
# Create frontend .env file
cat > frontend/.env.production << EOF
REACT_APP_API_URL=/api
EOF
```

## Step 5: Build and Run with Docker Compose

```bash
# Build the Docker image
docker-compose build

# Run database migrations
docker-compose run --rm web python manage.py migrate

# Create superuser (for Django admin)
docker-compose run --rm web python manage.py createsuperuser

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f web
```

## Step 6: Configure Nginx (Recommended for Production)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/q-safe
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (for future features)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts for large file uploads and QR reconstruction
        proxy_connect_timeout 1800s;
        proxy_send_timeout 1800s;
        proxy_read_timeout 1800s;
    }
}
```

```bash
# Enable site and reload Nginx
sudo ln -s /etc/nginx/sites-available/q-safe /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

## Step 8: Configure EC2 Security Group

In AWS Console > EC2 > Security Groups:

**Inbound Rules:**
- SSH (22) - Your IP only
- HTTP (80) - 0.0.0.0/0
- HTTPS (443) - 0.0.0.0/0

## Step 9: Setup PostgreSQL (if using RDS)

```bash
# Install PostgreSQL client
sudo apt install -y postgresql-client

# Create database
psql -h your-rds-endpoint -U postgres -c "CREATE DATABASE q_safe;"
```

## Step 10: Monitoring and Maintenance

```bash
# View logs
docker-compose logs -f web
docker-compose logs -f redis

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Cleanup old images
docker system prune -a

# Backup database (PostgreSQL)
pg_dump -h database-host -U username q_safe > backup_$(date +%Y%m%d).sql
```

## Common Commands

```bash
# Update application
git pull
docker-compose build
docker-compose up -d

# Run migrations
docker-compose run --rm web python manage.py migrate

# Collect static files (if needed)
docker-compose run --rm web python manage.py collectstatic --noinput

# Create new admin user
docker-compose run --rm web python manage.py createsuperuser

# Access Django shell
docker-compose run --rm web python manage.py shell

# View running containers
docker-compose ps

# Check resource usage
docker stats
```

## Troubleshooting

### Issue: Container won't start
```bash
# Check logs
docker-compose logs web

# Check if port 8000 is in use
sudo lsof -i :8000

# Restart from scratch
docker-compose down -v
docker-compose up -d
```

### Issue: Database connection errors
```bash
# Test database connection
docker-compose run --rm web python manage.py dbshell

# Check DATABASE_URL in .env file
# Ensure database exists and credentials are correct
```

### Issue: Static files not loading
```bash
# Recollect static files
docker-compose run --rm web python manage.py collectstatic --noinput --clear
docker-compose restart web
```

### Issue: Celery worker not processing jobs
```bash
# Check Celery logs
docker-compose logs web | grep celery

# Restart container
docker-compose restart web

# Test Redis connection
docker-compose exec redis redis-cli ping
```

## Production Checklist

- [ ] `DEBUG=False` in .env
- [ ] Strong `SECRET_KEY` generated
- [ ] `ALLOWED_HOSTS` configured with your domain
- [ ] `CORS_ALLOWED_ORIGINS` configured correctly
- [ ] PostgreSQL database configured (not SQLite)
- [ ] Supabase credentials configured
- [ ] SSL certificate installed
- [ ] Firewall configured (Security Groups)
- [ ] Database backups configured
- [ ] Monitoring setup (CloudWatch, etc.)
- [ ] Domain DNS configured
- [ ] Email notifications configured (optional)

## Performance Tuning

### For better performance on EC2:

**1. Update Gunicorn workers:**
Edit `backend/entrypoint.sh`:
```bash
# For 2 CPU cores
exec gunicorn backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --timeout 1800 \
    --workers 3 \
    --threads 2 \
    --max-requests 1000 \
    --max-requests-jitter 50
```

**2. Increase Celery concurrency:**
Edit `backend/entrypoint.sh`:
```bash
celery -A backend worker --loglevel=info --concurrency=2 &
```

**3. Add Redis persistence:**
Edit `docker-compose.yml`:
```yaml
redis:
  command: redis-server --appendonly yes --maxmemory 256mb
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review Django logs: `backend/logs/`
- Check GitHub issues

---

**Note:** After deployment, test all features:
- User registration/login
- File upload (online mode)
- QR code generation (offline mode)
- File download
- QR reconstruction
