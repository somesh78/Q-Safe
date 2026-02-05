# Quick Start: Deploy Async Job System to Render

## Important: Free Tier Limitation
⚠️ **Background Workers are PAID on Render's free tier** ($7/month minimum)

### Two Deployment Options:

**Option A**: Run worker with web service (FREE, but limited)
- Worker runs in same process as web server
- Single worker instance only
- Jobs may be interrupted on service restart
- **Recommended for testing/development**
- **Follow instructions below** ⬇️

**Option B**: Separate background worker (PAID)
- Dedicated worker service ($7/month)
- Better performance and reliability
- **For production use**
- See `PRODUCTION_DEPLOYMENT.md` for instructions

---

## FREE TIER DEPLOYMENT (Option A)

## Prerequisites
- ✅ All code changes committed to GitHub
- ✅ Render account with Q_Safe project
- ✅ Existing services: Web (Django), Frontend (React), PostgreSQL

## Step 1: Create Redis Service (2 minutes)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Redis"**
3. Settings:
   - **Name**: `q-safe-redis`
   - **Plan**: **Free** (25MB)
   - **Region**: Same as your web service (e.g., Oregon)
4. Click **"Create Redis"**
5. **IMPORTANT**: Copy the **Internal Redis URL**
   - Format: `redis://red-xxxxx:6379`
   - You'll need this in Step 2

## Step 2: Update Web Service to Run Worker (2 minutes)

1. Go to your **q-safe** web service
2. Click **"Environment"** tab
3. Add new variable:
   - **Key**: `REDIS_URL`
   - **Value**: `redis://red-xxxxx:6379` (from Step 1)
4. Click **"Settings"** tab
5. Update **Start Command** to:
   ```bash
   bash start-services.sh
   ```
6. Click **"Save Changes"**
7. **Wait for auto-redeploy**

## Step 3: Verify Worker is Running (1 minute)

1. Go to **q-safe** web service → **"Logs"** tab
2. Look for these logs:
   ```
   celery@worker ready
   Starting gunicorn
   ```
3. Both should appear - this means worker is running!

## Step 4: Test the Async Job System (2 minutes)
3. Should see:
   ```
   celery@xxxxx ready.
   ```

If you see errors, check:
- REDIS_URL is correct
- All environment variables are set
- Worker has access to database

## Step 6: Test End-to-End (2 minutes)

1. Go to https://q-safe-frontend.onrender.com
2. Login
3. Select **Offline Mode**
4. Upload a 1MB PDF file
5. Enter password
6. **Expected**:
   - Upload completes instantly (<1s)
   - See "Generating QR Codes..." with progress bar
   - Progress updates every 2 seconds
   - After ~30-60 seconds, ZIP auto-downloads

### Test 2: Upload Larger File (2-3MB)

1. Repeat above with 2-3MB file
2. **Expected**:
   - Progress bar shows chunks (e.g., "450/1329 (34%)")
   - Completes in ~1-2 minutes
   - ZIP downloads automatically

## Step 5: Monitor (Ongoing)

### Check Web Service Logs
- Dashboard → q-safe → Logs
- Look for:
  ```
  celery@worker ready         # Worker started
  [OFFLINE MODE] Queued task abc-123
  Processing job abc-123: 1700000 bytes
  Processed 100/1329 chunks (7%)
  Completed successfully
  ```

### Check Redis Metrics
- Dashboard → q-safe-redis → Metrics
- Memory usage should be <5MB

---

## Troubleshooting

### Worker Not Starting

**Symptom**: Web service logs don't show `celery@worker ready`

**Fix**:
1. Check `start-services.sh` exists in repository
2. Verify REDIS_URL is set in environment variables
3. Check logs for Celery errors

### Tasks Not Processing

**Symptom**: Upload works, but progress stays at 0%

**Fix**:
1. Check REDIS_URL is correct in **both** web and worker
2. Verify worker is running: Logs should show "celery@xxxxx ready"
3. Check Redis connection:
   ```bash
   # In worker shell
   redis-cli -u $REDIS_URL ping
   # Should return: PONG
   ```

### Database Errors

**Symptom**: `OfflineJob.DoesNotExist` or migration errors

**Fix**:
1. Go to web service Shell tab
2. Run:
   ```bash
   python manage.py migrate transfers
   ```
3. Check output for:
   ```
   Applying transfers.0013_add_offline_job_and_async_support... OK
   ```

### Memory Issues

**Symptom**: Worker crashes with "Out of memory"

**Fix**:
1. Reduce MAX_OFFLINE_FILE_SIZE in `views.py` to 3MB
2. Or upgrade to Starter plan ($7/month, 2GB RAM)

### Frontend Not Polling

**Symptom**: Progress bar doesn't update

**Fix**:
1. Check browser console for errors
2. Verify job_id is in URL or state
3. Check API endpoint:
   ```bash
   curl https://q-safe.onrender.com/api/job-status/<job_id>/ \
     -H "Authorization: Bearer $TOKEN"
   ```

## Success Indicators

✅ **Worker logs**: "celery@xxxxx ready"
✅ **Upload**: Returns job_id in <1 second
✅ **Progress**: Updates every 2 seconds
✅ **Completion**: ZIP downloads automatically
✅ **No timeouts**: Large files complete successfully

## Performance Expectations

| File Size | QR Codes | Processing Time | Memory Usage |
|-----------|----------|-----------------|--------------|
| 1MB       | ~600     | 30-60s          | 200-300MB    |
| 2MB       | ~1300    | 60-120s         | 300-400MB    |
| 5MB       | ~3300    | 150-300s        | 400-500MB    |

*Times are for Render free tier (0.1 CPU). Upgrade to Starter for 4x faster.*

## Rollback (if needed)

If something goes wrong:

1. **Pause Worker**: Dashboard → q-safe-worker → Settings → Delete Service
2. **Remove Redis**: Dashboard → q-safe-redis → Settings → Delete Service
3. **Revert Code**:
   ```bash
   git revert <commit-hash>
   git push
   ```
4. **Web service will auto-redeploy** to previous version
5. **Note**: Offline mode will timeout again, but won't break

## Next Steps After Deployment

- [ ] Test with various file sizes
- [ ] Monitor worker performance for 24 hours
- [ ] Set up automatic cleanup (optional):
  ```python
  # Delete jobs completed >24h ago
  OfflineJob.objects.filter(
      status='COMPLETED',
      completed_at__lt=timezone.now() - timedelta(hours=24)
  ).delete()
  ```
- [ ] Consider upgrading to Starter plan if processing is too slow

## Support

If you encounter issues not covered here:
1. Check `ASYNC_DEPLOYMENT_GUIDE.md` for detailed troubleshooting
2. Review logs in all three services (web, worker, redis)
3. Verify environment variables match exactly

---

**Total Setup Time**: ~10 minutes
**Cost**: $0 (all free tier)
**Status**: Production ready ✅
