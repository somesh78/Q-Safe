# Multi-stage build: Frontend + Backend
# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Bypass ESLint during build to prevent Ajv v8 conflict crashes
ENV DISABLE_ESLINT_PLUGIN=true

COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend with frontend static files
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libzbar0 \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/build ./frontend_build

# Create necessary directories and setup templates for serving React
RUN mkdir -p staticfiles logs storage templates && \
    cp frontend_build/index.html templates/

# Expose port
EXPOSE 8000

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Health check (Use httpx or python-native since requests is not in requirements.txt)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/api/health/', timeout=5)"

# Run entrypoint script
CMD ["./entrypoint.sh"]
