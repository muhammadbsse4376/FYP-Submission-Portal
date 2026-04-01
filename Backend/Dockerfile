# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements_fixed.txt .
RUN pip install --no-cache-dir -r requirements_fixed.txt

# Copy application code
COPY . .

# Expose port 8080 (Fly.io default)
EXPOSE 8080

# Set environment variable for Flask
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# Run the app with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--timeout", "120", "--workers", "2", "app:create_app()"]
