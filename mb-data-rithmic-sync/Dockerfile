# syntax=docker/dockerfile:1.6
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install build dependencies (cryptography needs them on some platforms)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev libssl-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/

EXPOSE 8001

# Railway exposes $PORT; default to 8001 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001} --log-level info"]
