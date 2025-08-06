# Gunicorn Configuration for Production
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
preload_app = True

# Timeout settings
timeout = 30
keepalive = 2
graceful_timeout = 30

# Logging
loglevel = os.environ.get('LOG_LEVEL', 'info')
accesslog = '/app/logs/access.log'
errorlog = '/app/logs/error.log'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'visitor_management_system'

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# SSL (if terminating SSL at Gunicorn level instead of Nginx)
# keyfile = '/app/ssl/server.key'
# certfile = '/app/ssl/server.crt'

# Application module
wsgi_module = 'run:app'

# User and group to run as (for security)
user = 1001
group = 1001

# Preload application for better performance
preload_app = True

# Enable stats
enable_stdio_inheritance = True

# Memory management
max_requests = 1000
max_requests_jitter = 100

# Worker restart settings
worker_tmp_dir = '/dev/shm'  # Use RAM for better performance

# Hooks for application lifecycle
def when_ready(server):
    """Called just after the server is started."""
    server.log.info("Server is ready. Spawning workers")

def worker_int(worker):
    """Called just after a worker has been killed."""
    worker.log.info("worker received INT or QUIT signal")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def pre_exec(server):
    """Called just before a new master process is forked."""
    server.log.info("Forked child, re-executing.")

def post_worker_init(worker):
    """Called just after a worker has initialized the application."""
    worker.log.info("Worker initialized")

def worker_abort(worker):
    """Called when a worker received the SIGABRT signal."""
    worker.log.info("Worker received SIGABRT signal")

# Additional performance tuning
pythonpath = '/app'
tmp_upload_dir = '/tmp'
