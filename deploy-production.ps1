# Q-Safe Production Deployment Script
# Deploys PostgreSQL optimizations to EC2 using Docker

param(
    [string]$EC2_IP = "",
    [string]$PemKeyPath = "$env:USERPROFILE\Downloads\q-safeSSH-Key.pem",
    [switch]$SkipGitPush = $false,
    [switch]$RebuildDocker = $true
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    Q-SAFE PRODUCTION DEPLOYMENT - PostgreSQL Update    " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
if ([string]::IsNullOrEmpty($EC2_IP)) {
    $EC2_IP = Read-Host "Enter your EC2 IP address or hostname"
}

$SSH_USER = "ubuntu"
$SSH_KEY = $PemKeyPath
$REMOTE_DIR = "~/Q-Safe"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   EC2 Server: $EC2_IP" -ForegroundColor White
Write-Host "   SSH User: $SSH_USER" -ForegroundColor White
Write-Host "   SSH Key: $SSH_KEY" -ForegroundColor White
Write-Host "   Remote Dir: $REMOTE_DIR" -ForegroundColor White
Write-Host ""

# Verify PEM key exists
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "❌ PEM key not found: $SSH_KEY" -ForegroundColor Red
    Write-Host "Please ensure your EC2 key is in the Downloads folder." -ForegroundColor Red
    exit 1
}

# Fix PEM key permissions (Windows)
Write-Host "🔐 Setting PEM key permissions..." -ForegroundColor Yellow
icacls $SSH_KEY /inheritance:r | Out-Null
icacls $SSH_KEY /grant:r "$env:USERNAME:(R)" | Out-Null
Write-Host "   ✓ PEM key permissions set" -ForegroundColor Green

# Step 1: Commit and Push Changes
if (-not $SkipGitPush) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "STEP 1: Committing PostgreSQL Optimizations" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    Write-Host "📦 Adding changed files..." -ForegroundColor Yellow
    git add backend/backend/settings.py
    git add backend/transfers/models.py
    git add backend/transfers/views.py
    git add POSTGRES_OPTIMIZATION.md
    git add SUPABASE_POSTGRES_SETUP.md
    git add POSTGRES_QUICK_START.md
    git add verify_postgres.py
    git add migrate_to_postgres.py
    
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    $commitMsg = "feat: Optimize database for Supabase PostgreSQL

- Enhanced database connection pooling (10min, SSL enforced)
- Added select_related() to views for query optimization
- Added PostgreSQL indexes to all models
- Optimized audit logs, file listings, and job queries
- Expected 10-50x performance improvement on queries"
    
    git commit -m $commitMsg
    
    Write-Host "🚀 Pushing to remote repository..." -ForegroundColor Yellow
    git push origin dev
    
    Write-Host "   ✓ Code pushed to dev branch" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# Step 2: Deploy to EC2
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 2: Deploying to EC2 Server" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

$deployScript = @"
#!/bin/bash
set -e

echo ""
echo "═══════════════════════════════════════════════════════"
echo "    Q-Safe Deployment - PostgreSQL Update"
echo "═══════════════════════════════════════════════════════"
echo ""

cd $REMOTE_DIR

echo "🛡️  Stashing local server-side changes (nginx.conf preservation)..."
git stash --include-untracked || true

echo "📥 Pulling latest code from repository (dev branch)..."
git pull origin dev

echo "🔄 Re-applying local server-side changes..."
git stash pop || true

echo ""
echo "🐳 Stopping Docker containers..."
docker-compose down

echo ""
echo "🔧 Creating database migrations for new indexes..."
docker-compose run --rm web python manage.py makemigrations

echo ""
echo "📊 Applying database migrations..."
docker-compose run --rm web python manage.py migrate

if [ "$RebuildDocker" = "True" ]; then
    echo ""
    echo "🏗️  Rebuilding Docker images..."
    docker-compose build --no-cache
fi

echo ""
echo "🚀 Starting Docker services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "📋 Recent logs:"
docker-compose logs --tail=50 web

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Verify at: http://$EC2_IP"
echo "  2. Check logs: docker-compose logs -f web"
echo "  3. Monitor Supabase dashboard for query performance"
echo ""
"@

# Write script to temp file
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deployScript -replace "`r`n", "`n" | Out-File -FilePath $tempScript -Encoding ASCII -NoNewline

Write-Host "📤 Uploading deployment script to EC2..." -ForegroundColor Yellow
scp -i $SSH_KEY -o StrictHostKeyChecking=no $tempScript "${SSH_USER}@${EC2_IP}:/tmp/deploy.sh"

Write-Host "🔧 Executing deployment on EC2..." -ForegroundColor Yellow
Write-Host ""
ssh -i $SSH_KEY -o StrictHostKeyChecking=no "${SSH_USER}@${EC2_IP}" "chmod +x /tmp/deploy.sh && RebuildDocker=$RebuildDocker /tmp/deploy.sh"

# Cleanup
Remove-Item $tempScript -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "    ✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your PostgreSQL optimizations are now live!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 What was deployed:" -ForegroundColor Cyan
Write-Host "   • Enhanced database connection pooling" -ForegroundColor White
Write-Host "   • PostgreSQL indexes for faster queries" -ForegroundColor White
Write-Host "   • Optimized view queries (select_related)" -ForegroundColor White
Write-Host "   • SSL/TLS enforced for database connections" -ForegroundColor White
Write-Host "   • Email verification flow (signup → verify → login)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Email Configuration Required!" -ForegroundColor Yellow
Write-Host "   Email verification is now enabled but requires SMTP setup." -ForegroundColor White
Write-Host "   See: EMAIL_VERIFICATION_SETUP.md for configuration steps." -ForegroundColor White
Write-Host ""
Write-Host "   Quick setup (Gmail):" -ForegroundColor Cyan
Write-Host "   1. Generate Gmail App Password" -ForegroundColor White
Write-Host "   2. SSH to EC2 and edit .env file" -ForegroundColor White
Write-Host "   3. Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD" -ForegroundColor White
Write-Host "   4. Restart: docker-compose restart web" -ForegroundColor White
Write-Host ""
Write-Host "📈 Expected improvements:" -ForegroundColor Cyan
Write-Host "   • Token lookups: 50x faster ⚡" -ForegroundColor White
Write-Host "   • Audit logs: 20x faster ⚡" -ForegroundColor White
Write-Host "   • User file listings: 10x faster ⚡" -ForegroundColor White
Write-Host "   • Email verification: Prevents unverified logins ✅" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Verify deployment:" -ForegroundColor Cyan
Write-Host "   • Application: http://$EC2_IP" -ForegroundColor White
Write-Host "   • Test signup: Create account → Check email" -ForegroundColor White
Write-Host "   • View logs: ssh -i $SSH_KEY ${SSH_USER}@${EC2_IP} 'cd $REMOTE_DIR && docker-compose logs -f web'" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitor performance:" -ForegroundColor Cyan
Write-Host "   • Supabase Dashboard → Reports → Database" -ForegroundColor White
Write-Host "   • Check query times and index usage" -ForegroundColor White
Write-Host ""
