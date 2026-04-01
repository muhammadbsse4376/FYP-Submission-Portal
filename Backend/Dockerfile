# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements_fixed.txt .
RUN pip install --no-cache-dir -r requirements_fixed.txt

# Copy application code
COPY . .

# Expose port 8000 (Standard for Flask/Gunicorn)
EXPOSE 8000

# Set environment variable for Flask
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Run database migrations and start the app with Gunicorn
CMD ["sh", "-c", "flask db upgrade && gunicorn --bind 0.0.0.0:8000 --timeout 120 --workers 4 --worker-class sync app:create_app()"]
