# PowerShell скрипт для создания всех функций

$functions = @(
  "add-energy", "add-reaction", "admin-users", "blacklist", "create-payment",
  "create-user", "generate-upload-url", "get-conversations", "get-messages",
  "get-subscriptions", "get-user", "login", "payment-webhook", "private-messages",
  "profile-photos", "register", "reset-password", "send-message", "send-sms",
  "subscribe", "update-activity", "verify-sms"
)

Write-Host "Создание $($functions.Count) функций..." -ForegroundColor Green

foreach ($func in $functions) {
  Write-Host "`nСоздаю функцию: $func" -ForegroundColor Yellow
  
  yc serverless function create `
    --name=$func `
    --description="Function $func"
  
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Функция $func создана" -ForegroundColor Green
    
    Write-Host "Деплою код для $func..." -ForegroundColor Cyan
    
    yc serverless function version create `
      --function-name=$func `
      --runtime=python311 `
      --entrypoint=index.handler `
      --memory=256m `
      --execution-timeout=30s `
      --source-path="backend/$func" `
      --environment DATABASE_URL="postgresql://gen_user:K=w7hxumpubT-F@f54d84cf7c4086988278b301.twc1.net:5432/default_db?sslmode=require" `
      --environment TIMEWEB_S3_ACCESS_KEY="SCNT881ZF0O4YGRJIR5S" `
      --environment TIMEWEB_S3_SECRET_KEY="ufDaLrE5DyCLqD8nM4825pJrofQx0fu3pVOC12EU" `
      --environment TIMEWEB_S3_BUCKET_NAME="271e14e8-dfb0140-f925-43fc-9e59-9c13eb081128" `
      --environment TIMEWEB_S3_ENDPOINT="https://s3.twcstorage.ru" `
      --environment TIMEWEB_S3_REGION="ru-1" `
      --environment SMSRU_API_KEY="4FBA9B3D-C085-062E-D00C-0B734F1A51CA" `
      --environment YOOKASSA_SHOP_ID="1173503" `
      --environment YOOKASSA_SECRET_KEY="test_pSRroubtlIABfY4JiT6D-XYR09on5Nh6KPk-dRSJbak" `
      --environment ADMIN_SECRET="o7OJN16x2uDyokGwVJ" `
      --environment JWT_SECRET="uH9x3mK7pL2wN5qR8tY4vZ6aB1cD0eF3gH" `
      --environment IMGBB_API_KEY="13b647d5f8a32c81c91c78bf7a121b33"
    
    if ($LASTEXITCODE -eq 0) {
      Write-Host "✅ Код задеплоен для $func" -ForegroundColor Green
      
      Write-Host "Делаю функцию публичной..." -ForegroundColor Cyan
      yc serverless function allow-unauthenticated-invoke $func
      
    } else {
      Write-Host "❌ Ошибка деплоя $func" -ForegroundColor Red
    }
  } else {
    Write-Host "❌ Ошибка создания $func" -ForegroundColor Red
  }
  
  Write-Host "---" -ForegroundColor Gray
}

Write-Host "`n🎉 Готово! Все функции созданы и задеплоены." -ForegroundColor Green
