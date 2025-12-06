# PowerShell скрипт для деплоя функций на Yandex Cloud

$FOLDER_ID = "b1gjs392ibop1gc5stqn"
$DATABASE_URL = "postgresql://gen_user:K=w7hxumpubT-F@f54d84cf7c4086988278b301.twc1.net:5432/default_db?sslmode=require"

# Минимальные env vars для работы (остальные пока заглушки)
$TIMEWEB_S3_ACCESS_KEY = "placeholder"
$TIMEWEB_S3_SECRET_KEY = "placeholder"
$TIMEWEB_S3_BUCKET_NAME = "placeholder"
$TIMEWEB_S3_ENDPOINT = "https://s3.twcstorage.ru"
$TIMEWEB_S3_REGION = "ru-1"
$SMSRU_API_KEY = "placeholder"
$YOOKASSA_SHOP_ID = "placeholder"
$YOOKASSA_SECRET_KEY = "placeholder"
$ADMIN_SECRET = "placeholder"
$JWT_SECRET = "placeholder_jwt_secret_change_later"

Write-Host "=== Быстрый деплой с DATABASE_URL ===" -ForegroundColor Green
Write-Host "Folder ID: $FOLDER_ID" -ForegroundColor Gray
Write-Host "Database: Timeweb PostgreSQL" -ForegroundColor Gray

$urls = @{}
$deployed = 0
$failed = 0

Write-Host "`n=== Начинаю деплой функций ===`n" -ForegroundColor Green

Get-ChildItem -Path "backend" -Directory | ForEach-Object {
    $funcName = $_.Name
    
    # Пропустить служебные
    if ($funcName -eq "func2url.json" -or $funcName -eq "webapp") {
        return
    }
    
    Write-Host "[$funcName] Обработка..." -ForegroundColor Yellow
    
    $funcPath = $_.FullName
    
    # Определить runtime
    if (Test-Path "$funcPath\index.py") {
        $runtime = "python311"
        $entrypoint = "index.handler"
    } elseif (Test-Path "$funcPath\index.ts") {
        $runtime = "nodejs18"
        $entrypoint = "index.handler"
    } else {
        Write-Host "[$funcName] Пропущено - нет handler" -ForegroundColor Red
        return
    }
    
    # Создать функцию (игнорируем ошибку если уже существует)
    yc serverless function create --name $funcName --folder-id $FOLDER_ID 2>$null
    
    # Деплой БЕЗ ZIP (direct source-path)
    $result = yc serverless function version create `
        --function-name $funcName `
        --runtime $runtime `
        --entrypoint $entrypoint `
        --memory 256m `
        --execution-timeout 30s `
        --source-path $funcPath `
        --folder-id $FOLDER_ID `
        --environment DATABASE_URL=$DATABASE_URL `
        --environment TIMEWEB_S3_ACCESS_KEY=$TIMEWEB_S3_ACCESS_KEY `
        --environment TIMEWEB_S3_SECRET_KEY=$TIMEWEB_S3_SECRET_KEY `
        --environment TIMEWEB_S3_BUCKET_NAME=$TIMEWEB_S3_BUCKET_NAME `
        --environment TIMEWEB_S3_ENDPOINT=$TIMEWEB_S3_ENDPOINT `
        --environment TIMEWEB_S3_REGION=$TIMEWEB_S3_REGION `
        --environment SMSRU_API_KEY=$SMSRU_API_KEY `
        --environment YOOKASSA_SHOP_ID=$YOOKASSA_SHOP_ID `
        --environment YOOKASSA_SECRET_KEY=$YOOKASSA_SECRET_KEY `
        --environment ADMIN_SECRET=$ADMIN_SECRET `
        --environment JWT_SECRET=$JWT_SECRET `
        2>&1
    
    if ($LASTEXITCODE -eq 0) {
        # Получить ID функции
        $funcInfo = yc serverless function get $funcName --folder-id $FOLDER_ID --format json | ConvertFrom-Json
        $funcId = $funcInfo.id
        
        # Публичный доступ
        yc serverless function allow-unauthenticated-invoke $funcName --folder-id $FOLDER_ID 2>$null
        
        $funcUrl = "https://functions.yandexcloud.net/$funcId"
        Write-Host "[$funcName] Успешно -> $funcUrl" -ForegroundColor Green
        
        $urls[$funcName] = $funcUrl
        $deployed++
    } else {
        Write-Host "[$funcName] Ошибка деплоя" -ForegroundColor Red
        $failed++
    }
}

# Сохранить func2url.json
$urls | ConvertTo-Json | Set-Content "backend\func2url.json" -Encoding UTF8

Write-Host "`n=== Результат ===" -ForegroundColor Green
Write-Host "Успешно: $deployed" -ForegroundColor Green
Write-Host "Ошибок: $failed" -ForegroundColor Red

Write-Host "`nfunc2url.json обновлен!" -ForegroundColor Green
Write-Host "Теперь:" -ForegroundColor Yellow
Write-Host "  1. git add backend\func2url.json"
Write-Host "  2. git commit -m 'Migrate to Yandex Cloud'"
Write-Host "  3. git push"
Write-Host "  4. Опубликуй фронтенд на poehali.dev"