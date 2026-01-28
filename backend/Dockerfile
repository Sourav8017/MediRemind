# Use official lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies (needed for compilation or specific libs)
# libpq-dev is often needed for psycopg2 building (though we use binary)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Cloud Run defaults to 8080, we match uvicorn)
EXPOSE 8080

# Run the worker in the background and the main app
# Note: In a real microservices architecture, these should be separate containers.
# For simplicity/cost, we'll run both with a start script or just the main app.
# The user asked for "background worker triggers alert", so we need both running.
# We'll use a simple shell script to launch both.

RUN echo '#!/bin/bash\n\
python worker.py &\n\
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}\n\
' > start.sh && chmod +x start.sh

CMD ["./start.sh"]
