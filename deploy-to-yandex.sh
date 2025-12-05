#!/bin/bash

# Скрипт для автоматического деплоя всех функций на Yandex Cloud
# Использование: ./deploy-to-yandex.sh

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка наличия yc CLI
if ! command -v yc &> /dev/null; then
    echo -e "${RED}Ошибка: Yandex Cloud CLI не установлен${NC}"
    echo "Установите его: curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash"
    exit 1
fi

echo -e "${GREEN}=== Деплой функций AuxChat на Yandex Cloud ===${NC}\n"

# Запросить параметры
read -p "Folder ID (из yc resource-manager folder list): " FOLDER_ID
read -p "Service Account ID (из yc iam service-account list): " SA_ID

if [ -z "$FOLDER_ID" ] || [ -z "$SA_ID" ]; then
    echo -e "${RED}Ошибка: Folder ID и Service Account ID обязательны${NC}"
    exit 1
fi

# Запросить секреты
echo -e "\n${YELLOW}Введите секреты проекта:${NC}"
read -p "DATABASE_URL: " DATABASE_URL
read -p "TIMEWEB_S3_ACCESS_KEY: " TIMEWEB_S3_ACCESS_KEY
read -p "TIMEWEB_S3_SECRET_KEY: " TIMEWEB_S3_SECRET_KEY
read -p "TIMEWEB_S3_BUCKET_NAME: " TIMEWEB_S3_BUCKET_NAME
read -p "TIMEWEB_S3_ENDPOINT (default: https://s3.twcstorage.ru): " TIMEWEB_S3_ENDPOINT
TIMEWEB_S3_ENDPOINT=${TIMEWEB_S3_ENDPOINT:-https://s3.twcstorage.ru}
read -p "TIMEWEB_S3_REGION (default: ru-1): " TIMEWEB_S3_REGION
TIMEWEB_S3_REGION=${TIMEWEB_S3_REGION:-ru-1}
read -p "SMSRU_API_KEY: " SMSRU_API_KEY
read -p "YOOKASSA_SHOP_ID: " YOOKASSA_SHOP_ID
read -p "YOOKASSA_SECRET_KEY: " YOOKASSA_SECRET_KEY
read -p "ADMIN_SECRET: " ADMIN_SECRET

# JWT секрет генерируется автоматически
JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}JWT_SECRET сгенерирован автоматически${NC}"

# Счетчики
DEPLOYED=0
FAILED=0
SKIPPED=0

# Создать временный файл для URL
TMP_URLS=$(mktemp)
echo "{" > "$TMP_URLS"

echo -e "\n${YELLOW}Начинаю деплой функций...${NC}\n"

# Перебрать все папки в backend/
for dir in backend/*/; do
  FUNC_NAME=$(basename "$dir")
  
  # Пропустить служебные файлы
  if [ "$FUNC_NAME" = "func2url.json" ] || [ "$FUNC_NAME" = "webapp" ]; then
    continue
  fi
  
  echo -e "${YELLOW}[${FUNC_NAME}]${NC} Обработка..."
  
  # Определить runtime
  if [ -f "$dir/index.py" ]; then
    RUNTIME="python311"
    ENTRYPOINT="index.handler"
  elif [ -f "$dir/index.ts" ]; then
    RUNTIME="nodejs18"
    ENTRYPOINT="index.handler"
  else
    echo -e "${RED}[${FUNC_NAME}]${NC} Пропущено - нет handler файла"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  
  # Создать функцию (игнорировать ошибку если уже существует)
  yc serverless function create \
    --name "$FUNC_NAME" \
    --folder-id "$FOLDER_ID" \
    2>/dev/null || true
  
  # Упаковать код функции
  TEMP_ZIP=$(mktemp).zip
  cd "$dir"
  zip -r "$TEMP_ZIP" . > /dev/null
  cd - > /dev/null
  
  # Деплой версии
  if yc serverless function version create \
    --function-name "$FUNC_NAME" \
    --runtime "$RUNTIME" \
    --entrypoint "$ENTRYPOINT" \
    --memory 256m \
    --execution-timeout 30s \
    --source-path "$TEMP_ZIP" \
    --folder-id "$FOLDER_ID" \
    --service-account-id "$SA_ID" \
    --environment DATABASE_URL="$DATABASE_URL" \
    --environment TIMEWEB_S3_ACCESS_KEY="$TIMEWEB_S3_ACCESS_KEY" \
    --environment TIMEWEB_S3_SECRET_KEY="$TIMEWEB_S3_SECRET_KEY" \
    --environment TIMEWEB_S3_BUCKET_NAME="$TIMEWEB_S3_BUCKET_NAME" \
    --environment TIMEWEB_S3_ENDPOINT="$TIMEWEB_S3_ENDPOINT" \
    --environment TIMEWEB_S3_REGION="$TIMEWEB_S3_REGION" \
    --environment SMSRU_API_KEY="$SMSRU_API_KEY" \
    --environment YOOKASSA_SHOP_ID="$YOOKASSA_SHOP_ID" \
    --environment YOOKASSA_SECRET_KEY="$YOOKASSA_SECRET_KEY" \
    --environment ADMIN_SECRET="$ADMIN_SECRET" \
    --environment JWT_SECRET="$JWT_SECRET" \
    > /dev/null 2>&1; then
    
    # Получить ID функции
    FUNC_ID=$(yc serverless function get "$FUNC_NAME" --folder-id "$FOLDER_ID" --format json | grep -o '"id": "[^"]*' | cut -d'"' -f4)
    
    # Сделать функцию публичной
    yc serverless function allow-unauthenticated-invoke "$FUNC_NAME" --folder-id "$FOLDER_ID" > /dev/null 2>&1
    
    FUNC_URL="https://functions.yandexcloud.net/$FUNC_ID"
    echo -e "${GREEN}[${FUNC_NAME}]${NC} Успешно → $FUNC_URL"
    
    # Добавить в JSON
    echo "  \"$FUNC_NAME\": \"$FUNC_URL\"," >> "$TMP_URLS"
    
    DEPLOYED=$((DEPLOYED + 1))
  else
    echo -e "${RED}[${FUNC_NAME}]${NC} Ошибка деплоя"
    FAILED=$((FAILED + 1))
  fi
  
  # Удалить временный zip
  rm -f "$TEMP_ZIP"
done

# Закрыть JSON (убрать последнюю запятую)
sed -i '$ s/,$//' "$TMP_URLS"
echo "}" >> "$TMP_URLS"

# Скопировать в backend/func2url.json
cp "$TMP_URLS" backend/func2url.json
rm -f "$TMP_URLS"

echo -e "\n${GREEN}=== Результат ===${NC}"
echo -e "${GREEN}Успешно: $DEPLOYED${NC}"
echo -e "${RED}Ошибок: $FAILED${NC}"
echo -e "${YELLOW}Пропущено: $SKIPPED${NC}"

echo -e "\n${GREEN}✅ func2url.json обновлен!${NC}"
echo -e "${YELLOW}Теперь сделай:${NC}"
echo "  1. git add backend/func2url.json"
echo "  2. git commit -m 'Migrate to Yandex Cloud'"
echo "  3. git push"
echo "  4. Опубликуй фронтенд на poehali.dev"
