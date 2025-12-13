# ==========================================
# Stage 1: Build Frontend
# ==========================================
# Cache bust: 2025-12-13 16:10 - FINAL FIX telemetry scripts removed index.html L27-31 УДАЛЕНЫ
FROM node:18 AS frontend-builder

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json bun.lock ./
RUN npm install -g bun && bun install

# Копируем весь проект
COPY . .

# Билдим frontend
RUN bun run build

# ==========================================
# Stage 2: Python Backend + Nginx
# ==========================================
FROM python:3.11-slim

WORKDIR /app

# Устанавливаем nginx и curl для debug
RUN apt-get update && apt-get install -y nginx curl && rm -rf /var/lib/apt/lists/*

# Копируем backend функции
COPY backend/ /app/backend/

# Устанавливаем зависимости всех функций
RUN find /app/backend -name "requirements.txt" -exec pip install --no-cache-dir -r {} \;

# Устанавливаем FastAPI для HTTP сервера
RUN pip install --no-cache-dir fastapi uvicorn[standard] psycopg2-binary boto3 python-multipart

# ✅ Копируем готовый frontend билд из Stage 1
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Создаем HTTP сервер для backend функций
RUN cat > /app/server.py << 'EOF'
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import importlib.util
import os
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

backend_dir = Path("/app/backend")
functions = {}

for func_dir in backend_dir.iterdir():
    if func_dir.is_dir() and (func_dir / "index.py").exists():
        func_name = func_dir.name
        try:
            spec = importlib.util.spec_from_file_location(func_name, func_dir / "index.py")
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            functions[func_name] = module.handler
            print(f"✅ Loaded: {func_name}")
        except Exception as e:
            print(f"❌ Failed to load {func_name}: {e}")

class Context:
    def __init__(self, request_id, function_name):
        self.request_id = request_id
        self.function_name = function_name
        self.function_version = "1"
        self.memory_limit_in_mb = 256

@app.api_route("/{function_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def proxy(function_name: str, request: Request):
    parts = function_name.split('/', 1)
    func_name = parts[0]
    path = '/' + parts[1] if len(parts) > 1 else '/'
    
    if func_name not in functions:
        return Response(content='{"error":"Function not found"}', status_code=404, media_type="application/json")
    
    body = await request.body()
    event = {
        "httpMethod": request.method,
        "headers": dict(request.headers),
        "queryStringParameters": dict(request.query_params),
        "body": body.decode('utf-8') if body else "",
        "pathParams": {"path": path},
        "requestContext": {
            "requestId": request.headers.get("x-request-id", "local"),
            "identity": {
                "sourceIp": request.client.host if request.client else "127.0.0.1",
                "userAgent": request.headers.get("user-agent", "")
            },
            "httpMethod": request.method,
            "requestTime": "",
            "requestTimeEpoch": 0
        },
        "isBase64Encoded": False
    }
    
    context = Context(event["requestContext"]["requestId"], func_name)
    
    try:
        result = functions[func_name](event, context)
        return Response(
            content=result.get("body", ""),
            status_code=result.get("statusCode", 200),
            headers=dict(result.get("headers", {})),
            media_type=result.get("headers", {}).get("Content-Type", "application/json")
        )
    except Exception as e:
        return Response(content=f'{{"error":"{str(e)}"}}', status_code=500, media_type="application/json")

@app.get("/")
async def root():
    return {"status": "ok", "functions": list(functions.keys())}
EOF

# Настраиваем Nginx
RUN cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
    
    # Backend API - убираем /api/ префикс через rewrite
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # КРИТИЧЕСКИ ВАЖНО: передаём ВСЕ заголовки от клиента, не перезаписываем X-User-Id!
        proxy_pass_request_headers on;
        # Передаём query параметры
        proxy_pass_request_body on;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Создаем startup скрипт
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting services..."

# Показываем nginx конфиг для debug
echo "📋 Nginx config:"
cat /etc/nginx/sites-available/default | grep -A 15 "location /api/"

# Тестируем nginx конфиг
nginx -t

# Запускаем nginx
nginx
echo "✅ Nginx started"

# Тестируем что nginx отвечает
curl -I http://127.0.0.1:80/ || echo "⚠️ Nginx не отвечает!"

# Тестируем proxy /api/ → FastAPI
echo "🧪 Testing /api/ proxy before FastAPI starts..."
curl -I http://127.0.0.1:80/api/test 2>&1 | head -5

# Запускаем FastAPI backend ТОЛЬКО на localhost (через nginx)
echo "✅ Starting FastAPI on localhost:8000..."
exec uvicorn server:app --host 127.0.0.1 --port 8000
EOF

RUN chmod +x /app/start.sh

EXPOSE 80

CMD ["/app/start.sh"]