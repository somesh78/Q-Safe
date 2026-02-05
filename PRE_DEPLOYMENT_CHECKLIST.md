# Pre-Deployment Checklist

## Code Changes Verification

### Backend Files
- [x] `backend/backend/celery.py` - Celery app created
- [x] `backend/backend/__init__.py` - Celery import added
- [x] `backend/backend/settings.py` - Cache config fixed
- [x] `backend/requirements.txt` - celery==5.3.6, redis==5.0.1 added
- [x] `backend/Procfile` - Worker command added
- [x] `backend/transfers/models.py` - OfflineJob model added
- [x] `backend/transfers/tasks.py` - Async task created
- [x] `backend/transfers/views.py` - Async upload + endpoints added
- [x] `backend/transfers/urls.py` - New routes added
- [x] `backend/transfers/migrations/0013_*.py` - Migration created

### Frontend Files
- [x] `frontend/src/services/api.js` - Job status/download functions added
- [x] `frontend/src/pages/Home.jsx` - Progress polling implemented

### Documentation Files
- [x] `ASYNC_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- [x] `ASYNC_DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- [x] `QUICK_START_DEPLOYMENT.md` - Quick deployment steps

## Git Status

Before deploying, ensure all changes are committed:

```bash
# Check status
git status

# Should show:
# On branch main
# Your branch is ahead of 'origin/main' by X commits

# If there are uncommitted changes:
git add .
git commit -m "Implement async job system with Celery for offline QR generation"
git push origin main
```

## Files to Commit

### New Files (should be in git)
```
backend/backend/celery.py
backend/transfers/tasks.py
backend/transfers/migrations/0013_add_offline_job_and_async_support.py
ASYNC_IMPLEMENTATION_SUMMARY.md
ASYNC_DEPLOYMENT_GUIDE.md
QUICK_START_DEPLOYMENT.md
PRE_DEPLOYMENT_CHECKLIST.md
```

### Modified Files (should be in git)
```
backend/backend/__init__.py
backend/backend/settings.py
backend/requirements.txt
backend/Procfile
backend/transfers/models.py
backend/transfers/views.py
backend/transfers/urls.py
frontend/src/services/api.js
frontend/src/pages/Home.jsx
```

### Files NOT to Commit (should be in .gitignore)
```
__pycache__/
*.pyc
.env
db.sqlite3
node_modules/
.DS_Store
```

## Environment Variables to Set on Render

### Web Service (q-safe)
```bash
# Existing (keep these)
SECRET_KEY=<your-secret-key>
DATABASE_URL=postgres://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
SUPABASE_BUCKET=encrypted-files
FRONTEND_URL=https://q-safe-frontend.onrender.com
ALLOWED_HOSTS=q-safe.onrender.com

# NEW - Add this
REDIS_URL=redis://red-xxxxx:6379
```

### Worker Service (q-safe-worker) - NEW SERVICE
```bash
# Copy ALL from web service + add these
REDIS_URL=redis://red-xxxxx:6379
SECRET_KEY=<same-as-web>
DATABASE_URL=<same-as-web>
SUPABASE_URL=<same-as-web>
SUPABASE_SERVICE_KEY=<same-as-web>
SUPABASE_BUCKET=encrypted-files
FRONTEND_URL=https://q-safe-frontend.onrender.com
```

## Render Services Configuration

### 1. Redis Service
- [ ] Name: `q-safe-redis`
- [ ] Plan: Free (25MB)
- [ ] Region: Same as web service
- [ ] Internal URL copied

### 2. Web Service (existing)
- [ ] REDIS_URL environment variable added
- [ ] Auto-deploy triggered after code push
- [ ] Migration runs automatically (check logs)

### 3. Worker Service (NEW)
- [ ] Name: `q-safe-worker`
- [ ] Root Directory: `backend`
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `celery -A backend worker --loglevel=info`
- [ ] All environment variables set
- [ ] Plan: Free (512MB RAM, 0.1 CPU)

## Testing Checklist

### Local Testing (Optional)
If you want to test locally before deploying:

```bash
# Terminal 1: Start Redis
docker run -p 6379:6379 redis:latest

# Terminal 2: Start Django
cd backend
export REDIS_URL=redis://localhost:6379
python manage.py runserver

# Terminal 3: Start Celery Worker
cd backend
export REDIS_URL=redis://localhost:6379
celery -A backend worker --loglevel=info

# Terminal 4: Start Frontend
cd frontend
npm start
```

Test upload in offline mode and verify:
- [ ] Job queues successfully
- [ ] Worker picks up task
- [ ] Progress updates every 2 seconds
- [ ] ZIP downloads when complete

### Production Testing
After deployment:

- [ ] Upload 1MB file in offline mode
- [ ] Verify progress bar shows and updates
- [ ] ZIP downloads automatically
- [ ] Check worker logs show processing
- [ ] Upload 5MB file (max size)
- [ ] Verify no timeout errors
- [ ] Test online mode still works (unchanged)

## Rollback Plan

If deployment fails:

1. **Quick Rollback**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Manual Rollback**:
   - Dashboard → q-safe → Manual Deploy → Select previous commit

3. **Clean Up New Services** (if needed):
   - Delete q-safe-worker service
   - Delete q-safe-redis service
   - Remove REDIS_URL from web service

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Check worker logs every few hours
- [ ] Monitor Redis memory usage
- [ ] Test with various file sizes
- [ ] Watch for any error patterns

### Week 1
- [ ] Monitor database growth (ZIP files in BinaryField)
- [ ] Check processing times vs. expectations
- [ ] Gather user feedback
- [ ] Consider cleanup strategy for old jobs

### Performance Metrics to Track
- Average processing time per file size
- Memory usage on worker
- Redis memory usage
- Number of successful vs. failed jobs
- User wait time vs. old timeout

## Common Issues & Solutions

### Issue: Worker won't start
**Check**: Requirements.txt has celery and redis
**Fix**: Rebuild worker service

### Issue: Tasks not processing
**Check**: REDIS_URL matches in web and worker
**Fix**: Update environment variables and redeploy

### Issue: Migration not applied
**Check**: Web service logs for migration output
**Fix**: Run manually in Shell: `python manage.py migrate`

### Issue: Frontend doesn't show progress
**Check**: Browser console for errors
**Fix**: Verify API endpoints are accessible

## Success Criteria

✅ **Deployment Complete When**:
1. All three services running (web, worker, redis)
2. Worker logs show "celery@xxxxx ready"
3. Test upload completes without timeout
4. Progress bar updates in real-time
5. ZIP downloads automatically
6. No errors in logs

## Final Steps

- [ ] Push all code to GitHub
- [ ] Create Redis service on Render
- [ ] Add REDIS_URL to web service
- [ ] Create worker service
- [ ] Verify migration ran
- [ ] Test end-to-end
- [ ] Monitor for 24 hours
- [ ] Update README with new features
- [ ] Consider writing user-facing documentation

## Backup & Recovery

### Database Backup (Before Migration)
```bash
# From Render Shell
pg_dump $DATABASE_URL > backup_before_async.sql
```

### Code Backup
Commit hash of last stable version:
```bash
git log -1 --oneline
# Copy this hash for rollback reference
```

---

**Prepared By**: GitHub Copilot
**Date**: January 2025
**Status**: Ready for deployment 🚀
**Risk Level**: Low (backward compatible, rollback available)
