# Quick Deployment Guide

## Deploy PostgreSQL Optimizations to Production

### Prerequisites
✅ EC2 pem key: `q-safeSSH-Key.pem` (found in Downloads)  
✅ EC2 instance running  
✅ Git repository configured  

### Deploy Now (One Command)

**PowerShell (Windows):**
```powershell
# Full deployment with Docker rebuild
.\deploy-production.ps1

# Or specify EC2 IP directly
.\deploy-production.ps1 -EC2_IP "your-ec2-ip-here"

# Deploy without rebuilding Docker (faster)
.\deploy-production.ps1 -EC2_IP "your-ec2-ip" -RebuildDocker:$false

# Skip git push (if already pushed)
.\deploy-production.ps1 -SkipGitPush
```

### What Gets Deployed

✅ **Database Optimizations:**
- Enhanced connection pooling (10 minutes)
- SSL/TLS enforcement
- Query timeout protection (30s)

✅ **Model Indexes:**
- UploadSession indexes
- OnlineEncryptedFile indexes
- DownloadAudit indexes
- OfflineJob indexes

✅ **View Query Optimizations:**
- select_related() for audit logs
- select_related() for file downloads
- select_related() for job status
- only() for job downloads

### Deployment Process

The script will:
1. ✅ Fix PEM key permissions
2. ✅ Commit changes to Git
3. ✅ Push to remote repository
4. ✅ Connect to EC2 via SSH
5. ✅ Pull latest code
6. ✅ Stop Docker containers
7. ✅ Create migrations for new indexes
8. ✅ Apply migrations to PostgreSQL
9. ✅ Rebuild Docker images (optional)
10. ✅ Start services
11. ✅ Verify deployment

### Manual Deployment (Alternative)

**1. Commit and push:**
```powershell
git add .
git commit -m "feat: PostgreSQL optimizations"
git push origin main
```

**2. SSH to EC2:**
```powershell
ssh -i "$env:USERPROFILE\Downloads\q-safeSSH-Key.pem" ubuntu@your-ec2-ip
```

**3. Deploy on EC2:**
```bash
cd ~/Q-Safe

# Pull latest code
git pull origin main

# Stop containers
docker-compose down

# Create and apply migrations
docker-compose run --rm web python manage.py makemigrations
docker-compose run --rm web python manage.py migrate

# Rebuild and start
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f web
```

### Verify Deployment

**Check application:**
```
http://your-ec2-ip/
```

**View logs:**
```powershell
ssh -i "$env:USERPROFILE\Downloads\q-safeSSH-Key.pem" ubuntu@your-ec2-ip
cd ~/Q-Safe
docker-compose logs -f web
```

**Monitor database:**
- Go to Supabase Dashboard → Reports → Database
- Check query performance
- Verify index usage

### Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Token lookups | ~100ms | ~2ms | 50x faster ⚡ |
| Audit logs (100) | ~500ms | ~25ms | 20x faster ⚡ |
| File listings (50) | ~300ms | ~30ms | 10x faster ⚡ |
| Download queries | 5 queries | 2 queries | 60% reduction |

### Troubleshooting

**PEM key permission error:**
```powershell
icacls "$env:USERPROFILE\Downloads\q-safeSSH-Key.pem" /inheritance:r
icacls "$env:USERPROFILE\Downloads\q-safeSSH-Key.pem" /grant:r "$env:USERNAME:(R)"
```

**Can't connect to EC2:**
- Verify EC2 security group allows SSH (port 22)
- Check EC2 IP address is correct
- Ensure EC2 instance is running

**Docker build fails:**
- SSH to EC2 and check disk space: `df -h`
- Check Docker logs: `docker-compose logs web`
- Verify environment variables: `docker-compose config`

**Migration errors:**
- Check DATABASE_URL is set correctly
- Verify PostgreSQL is accessible
- Run: `docker-compose run --rm web python manage.py showmigrations`

### Quick Commands

**View service status:**
```bash
ssh -i ~/Downloads/q-safeSSH-Key.pem ubuntu@$EC2_IP "cd ~/Q-Safe && docker-compose ps"
```

**Restart service:**
```bash
ssh -i ~/Downloads/q-safeSSH-Key.pem ubuntu@$EC2_IP "cd ~/Q-Safe && docker-compose restart web"
```

**View recent logs:**
```bash
ssh -i ~/Downloads/q-safeSSH-Key.pem ubuntu@$EC2_IP "cd ~/Q-Safe && docker-compose logs --tail=100 web"
```

### Post-Deployment Checklist

- [ ] Application accessible at EC2 IP
- [ ] User login/registration works
- [ ] File upload works (online mode)
- [ ] File download works
- [ ] Check Supabase Dashboard for query performance
- [ ] Monitor Docker logs for errors
- [ ] Verify database indexes created: See POSTGRES_OPTIMIZATION.md

🎉 **Ready to deploy!**
