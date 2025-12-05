#!/bin/bash

# Скрипт для первоначальной настройки Yandex Cloud
# Создает folder, service account и выдает права

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Настройка Yandex Cloud для AuxChat ===${NC}\n"

# Проверка yc CLI
if ! command -v yc &> /dev/null; then
    echo -e "${RED}Ошибка: Yandex Cloud CLI не установлен${NC}"
    echo "Установите его: curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash"
    exit 1
fi

# Проверка авторизации
if ! yc config profile list &> /dev/null; then
    echo -e "${YELLOW}Требуется авторизация в Yandex Cloud${NC}"
    yc init
fi

# Получить текущий cloud ID
CLOUD_ID=$(yc config get cloud-id)
if [ -z "$CLOUD_ID" ]; then
    echo -e "${RED}Ошибка: Не удалось получить Cloud ID${NC}"
    echo "Выполните: yc init"
    exit 1
fi

echo -e "${GREEN}Cloud ID: $CLOUD_ID${NC}\n"

# Создать folder
echo -e "${YELLOW}Шаг 1: Создание folder${NC}"
read -p "Название folder (default: auxchat): " FOLDER_NAME
FOLDER_NAME=${FOLDER_NAME:-auxchat}

if yc resource-manager folder create --name "$FOLDER_NAME" --cloud-id "$CLOUD_ID" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Folder '$FOLDER_NAME' создан${NC}"
else
    echo -e "${YELLOW}⚠️  Folder '$FOLDER_NAME' уже существует${NC}"
fi

FOLDER_ID=$(yc resource-manager folder get "$FOLDER_NAME" --format json | grep -o '"id": "[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}Folder ID: $FOLDER_ID${NC}\n"

# Создать service account
echo -e "${YELLOW}Шаг 2: Создание service account${NC}"
SA_NAME="auxchat-sa"

if yc iam service-account create --name "$SA_NAME" --folder-id "$FOLDER_ID" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Service account '$SA_NAME' создан${NC}"
else
    echo -e "${YELLOW}⚠️  Service account '$SA_NAME' уже существует${NC}"
fi

SA_ID=$(yc iam service-account get "$SA_NAME" --folder-id "$FOLDER_ID" --format json | grep -o '"id": "[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}Service Account ID: $SA_ID${NC}\n"

# Выдать права
echo -e "${YELLOW}Шаг 3: Выдача прав${NC}"

# Права на выполнение функций
yc resource-manager folder add-access-binding "$FOLDER_ID" \
  --role serverless.functions.invoker \
  --subject serviceAccount:"$SA_ID" > /dev/null 2>&1 || true

echo -e "${GREEN}✅ Права serverless.functions.invoker выданы${NC}"

# Права на редактирование функций
yc resource-manager folder add-access-binding "$FOLDER_ID" \
  --role editor \
  --subject serviceAccount:"$SA_ID" > /dev/null 2>&1 || true

echo -e "${GREEN}✅ Права editor выданы${NC}\n"

# Сохранить параметры в файл
cat > yandex-cloud-config.env << EOF
# Параметры для deploy-to-yandex.sh
FOLDER_ID=$FOLDER_ID
SA_ID=$SA_ID
CLOUD_ID=$CLOUD_ID
FOLDER_NAME=$FOLDER_NAME
SA_NAME=$SA_NAME
EOF

echo -e "${GREEN}=== Готово! ===${NC}"
echo -e "${GREEN}Параметры сохранены в yandex-cloud-config.env${NC}\n"
echo -e "${YELLOW}Далее:${NC}"
echo "  1. Отредактируй yandex-cloud-config.env - добавь секреты"
echo "  2. Запусти: ./deploy-to-yandex.sh"
echo -e "\n${GREEN}Folder ID: $FOLDER_ID${NC}"
echo -e "${GREEN}Service Account ID: $SA_ID${NC}"
