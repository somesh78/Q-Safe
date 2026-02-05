# Async Job System Deployment Guide

## Overview
This guide covers deploying the async QR code generation system using Celery + Redis on Render.com.

## Architecture Changes

### Before (Synchronous)
```
User uploads file → Backend generates QR codes (2+ min) → Frontend times out (120s)
```

### After (Asynchronous)
```
User uploads file → Backend queues job (<1s) → Returns job_id
Background worker processes job → Updates progress in database
Frontend polls status every 2s → Shows progress → Downloads when complete
```

## Components

### 1. Backend Web Service (existing)
- Handles API requests
- Queues Celery tasks
- Returns job status

### 2. Background Worker Service (NEW)
- Processes Celery tasks
- Generates QR codes
- Updates job progress
- Stores results in database

### 3. Redis (NEW)
- Message broker for Celery
- Stores task results

## Render.com Deployment

### Step 1: Add Redis Service

1. Go to Render Dashboard → "New +" → "Redis"
2. Name: `q-safe-redis`
3. Plan: Free (25MB, sufficient for task queue)
4. Click "Create Redis"
5. Copy the **Internal Redis URL** (format: `redis://red-xxxxx:6379`)

### Step 2: Update Environment Variables

Add to **both Web Service and Worker**:

```bash
# Redis
REDIS_URL=<your-internal-redis-url>

# Existing variables (keep these)
SECRET_KEY=...
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SUPABASE_BUCKET=encrypted-files
FRONTEND_URL=https://q-safe-frontend.onrender.com
```

### Step 3: Create Background Worker Service

1. Go to Render Dashboard → "New +" → "Background Worker"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `q-safe-worker`
   - **Environment**: Python 3
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `celery -A backend worker --loglevel=info`
   - **Plan**: Free (512MB RAM, 0.1 CPU)

4. Add all environment variables (same as Web Service)

5. Click "Create Background Worker"

### Step 4: Run Database Migration

The new models need to be migrated:

```bash
# Render will auto-migrate on next deploy, or run manually:
python manage.py makemigrations transfers
python manage.py migrate
```

### Step 5: Deploy

1. Commit and push all changes
2. Render will auto-deploy Web Service
3. Worker Service will also auto-deploy
4. Check logs for both services

## Testing

### Test 1: Upload File (Offline Mode)

```bash
# Create session
curl -X POST https://q-safe.onrender.com/api/session/create/ \
  -H "Authorization: Bearer <token>" \
  -d '{"mode": "OFFLINE"}'

# Response: {"session_id": "..."}

# Upload file
curl -X POST https://q-safe.onrender.com/api/upload/ \
  -H "Authorization: Bearer <token>" \
  -F "session_id=..." \
  -F "password=test123" \
  -F "file=@test.pdf"

# Response:
{
  "message": "QR code generation started",
  "job_id": "abc-123-...",
  "task_id": "...",
  "filename": "test.pdf",
  "mode": "OFFLINE"
}
```

### Test 2: Check Job Status

```bash
curl -X GET https://q-safe.onrender.com/api/job-status/<job_id>/ \
  -H "Authorization: Bearer <token>"

# Response:
{
  "job_id": "abc-123-...",
  "status": "PROCESSING",  # or PENDING, COMPLETED, FAILED
  "progress": {
    "total_chunks": 1329,
    "processed_chunks": 450,
    "percent": 34
  },
  "original_filename": "test.pdf",
  "created_at": "2024-01-15T10:00:00Z",
  "completed_at": null,
  "error_message": null
}
```

### Test 3: Download Completed Job

```bash
curl -X GET https://q-safe.onrender.com/api/job-download/<job_id>/ \
  -H "Authorization: Bearer <token>" \
  -o qr_codes.zip

# Downloads the ZIP file with QR codes
```

## Frontend Integration

### API Service Updates

Update `frontend/src/services/api.js`:

```javascript
// Upload file (offline mode)
export const uploadFile = async (formData) => {
  const response = await api.post('/upload/', formData);
  return response.data; // { job_id, task_id, filename, mode }
};

// Check job status
export const getJobStatus = async (jobId) => {
  const response = await api.get(`/job-status/${jobId}/`);
  return response.data; // { status, progress, ... }
};

// Download job result
export const downloadJob = async (jobId) => {
  const response = await api.get(`/job-download/${jobId}/`, {
    responseType: 'blob'
  });
  return response.data; // ZIP blob
};
```

### Component Updates

Update `frontend/src/pages/offlineMode.jsx`:

```javascript
const [jobId, setJobId] = useState(null);
const [progress, setProgress] = useState(0);
const [status, setStatus] = useState('idle'); // idle, processing, completed, failed

// After upload
const handleUpload = async () => {
  const response = await uploadFile(formData);
  setJobId(response.job_id);
  setStatus('processing');
  pollJobStatus(response.job_id);
};

// Poll for status
const pollJobStatus = async (jobId) => {
  const interval = setInterval(async () => {
    const status = await getJobStatus(jobId);
    
    setProgress(status.progress.percent);
    
    if (status.status === 'COMPLETED') {
      clearInterval(interval);
      setStatus('completed');
      // Auto-download or show download button
    } else if (status.status === 'FAILED') {
      clearInterval(interval);
      setStatus('failed');
      alert(`Error: ${status.error_message}`);
    }
  }, 2000); // Poll every 2 seconds
};

// Download result
const handleDownload = async () => {
  const blob = await downloadJob(jobId);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qr_codes_${filename}.zip`;
  a.click();
};
```

### UI Updates

Add progress bar component:

```jsx
{status === 'processing' && (
  <div className="progress-container">
    <h3>Generating QR Codes...</h3>
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${progress}%` }}>
        {progress}%
      </div>
    </div>
    <p>Processing {progress}% of {totalChunks} QR codes</p>
  </div>
)}

{status === 'completed' && (
  <button onClick={handleDownload}>Download QR Codes</button>
)}
```

## Monitoring

### Check Worker Status

```bash
# SSH into worker (if available) or check logs
celery -A backend inspect active
celery -A backend inspect stats
```

### Check Redis

```bash
# Check Redis connection
redis-cli -u <REDIS_URL> ping
# Should return PONG

# Check task queue
redis-cli -u <REDIS_URL> llen celery
```

### View Logs

- **Web Service**: Render Dashboard → q-safe → Logs
- **Worker Service**: Render Dashboard → q-safe-worker → Logs
- **Redis**: Render Dashboard → q-safe-redis → Metrics

## Performance Expectations

### Processing Time
- **1MB file**: ~30-60 seconds (500-600 QR codes)
- **2MB file**: ~60-120 seconds (1000-1300 QR codes)
- **5MB file**: ~150-300 seconds (2500-3300 QR codes)

### Resource Usage
- **Worker RAM**: 200-400MB during processing
- **Redis RAM**: 5-10MB for task queue
- **Database**: ~10-50MB per job (stores ZIP in BinaryField)

## Troubleshooting

### Worker Not Starting

Check logs for:
```
ImportError: No module named 'celery'
```
**Fix**: Ensure requirements.txt has `celery==5.3.6` and `redis==5.0.1`

### Tasks Not Processing

Check:
1. Redis URL is correct in both services
2. Worker is running: `celery -A backend worker`
3. Task is queued: `redis-cli llen celery`

### Database Errors

```
OfflineJob.DoesNotExist
```
**Fix**: Run migrations:
```bash
python manage.py makemigrations transfers
python manage.py migrate
```

### Memory Issues

If worker runs out of memory (512MB):
- Reduce `MAX_OFFLINE_FILE_SIZE` to 3MB
- Add cleanup after download: `job.delete()`
- Consider upgrading to Render paid plan (more RAM)

## Cleanup Strategy

To prevent database bloat, add automatic cleanup:

```python
# In views.py job_download()
# After successful download:
job.delete()  # Delete job and result_file from database

# Or create a management command:
# backend/transfers/management/commands/cleanup_completed_jobs.py
from django.utils import timezone
from datetime import timedelta

# Delete jobs completed > 24 hours ago
cutoff = timezone.now() - timedelta(hours=24)
OfflineJob.objects.filter(
    status='COMPLETED',
    completed_at__lt=cutoff
).delete()
```

## Future Improvements

1. **Move to Supabase Storage**: Store result ZIP files in Supabase instead of BinaryField
2. **Email Notifications**: Send email when job completes
3. **Retry Logic**: Auto-retry failed jobs
4. **Priority Queue**: Prioritize smaller files
5. **Progress Streaming**: Use WebSockets for real-time progress
6. **Estimated Time**: Show "~2 minutes remaining"

## Cost Analysis

### Free Tier (Current)
- **Web Service**: Free (512MB RAM, 0.1 CPU)
- **Worker**: Free (512MB RAM, 0.1 CPU)
- **Redis**: Free (25MB)
- **PostgreSQL**: External (500MB)
- **Total**: $0/month

### Limitations
- Slow CPU (4x slower than local)
- 512MB RAM limit
- 5MB max file size

### Paid Upgrade ($7/month)
- **Worker**: Starter ($7/month) - 2GB RAM, 1 CPU
- **Benefits**:
  - 4x faster processing
  - 10MB+ file support
  - Better reliability

## Conclusion

The async system solves the timeout issue by:
- Immediate response (<1s)
- Background processing (no frontend timeout)
- Progress tracking (user sees status)
- Better resource utilization (dedicated worker)

All changes are backward compatible - online mode still works synchronously.
