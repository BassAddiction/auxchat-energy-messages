# Combined Frontend + Backend for AuxChat
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Backend only (Flask serves everything)
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY timeweb-backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY timeweb-backend/main.py ./

# Copy frontend build from stage 1
COPY --from=frontend-build /app/dist /app/static

EXPOSE 8080

# Healthcheck for Timeweb - check /api/health endpoint
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/health')" || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "main:app"]