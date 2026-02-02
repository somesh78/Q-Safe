FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libzbar0 \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Don't run collectstatic during build - will run in entrypoint
# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
