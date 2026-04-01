# Gunicorn configuration
import multiprocessing
import os

workers = max(2, multiprocessing.cpu_count() // 2)
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 120
keepalive = 5
bind = "0.0.0.0:8080"
backlog = 2048
