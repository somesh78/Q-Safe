import os
import logging
from celery import Celery
from decouple import config

logger = logging.getLogger(__name__)

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Get Redis URL from environment
REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

app = Celery('backend')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Configure Celery to use Redis as broker and result backend
app.conf.broker_url = REDIS_URL
app.conf.result_backend = REDIS_URL
app.conf.task_track_started = True
app.conf.task_serializer = 'json'
app.conf.result_serializer = 'json'
app.conf.accept_content = ['json']
app.conf.timezone = 'UTC'

# Connection settings to prevent blocking
app.conf.broker_connection_retry_on_startup = True
app.conf.broker_connection_retry = True
app.conf.broker_connection_max_retries = 10
app.conf.broker_pool_limit = 10
app.conf.broker_transport_options = {
    'visibility_timeout': 3600,
    'socket_timeout': 10,
    'socket_connect_timeout': 10,
}
app.conf.result_backend_transport_options = {
    'socket_timeout': 10,
    'socket_connect_timeout': 10,
}

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    logger.info(f'Celery debug task - Request: {self.request!r}')
