# 🔔 Настройка Push-уведомлений для AuxChat

## Что сделано:

✅ Firebase SDK установлен  
✅ Service Worker создан (`public/firebase-messaging-sw.js`)  
✅ Backend функции развернуты:
  - `save-fcm-token` - сохранение FCM токена пользователя
  - `send-push` - отправка push-уведомления
✅ Миграция БД выполнена (колонка `fcm_token` добавлена)

## Что нужно настроить:

### 1. Создать Firebase проект

1. Перейди на https://console.firebase.google.com/
2. Создай новый проект (например, "AuxChat")
3. Включи **Cloud Messaging** в проекте

### 2. Получить конфигурацию Firebase

1. В настройках проекта → "Общие" → "Ваши приложения"
2. Нажми "Добавить приложение" → выбери "Веб" (</> иконка)
3. Скопируй `firebaseConfig` объект
4. Замени конфиг в файлах:
   - `src/lib/firebase.ts` (строка 6-12)
   - `public/firebase-messaging-sw.js` (строка 9-15)

### 3. Получить VAPID ключ

1. В Firebase Console → Project Settings → Cloud Messaging
2. Перейди в "Web Push certificates"
3. Нажми "Generate key pair"
4. Скопируй **VAPID key**
5. Замени в `src/lib/firebase.ts` строка 22:
   ```typescript
   vapidKey: 'YOUR_VAPID_KEY_HERE'
   ```

### 4. Получить Server Key для backend

1. В Firebase Console → Project Settings → Cloud Messaging
2. Скопируй **Server key** (Cloud Messaging API (Legacy))
3. Добавь секрет в poehali.dev:
   - Название: `FIREBASE_SERVER_KEY`
   - Значение: твой Server Key

### 5. Интегрировать в приложение

Добавь вызов `requestNotificationPermission()` при входе пользователя:

```typescript
// В src/pages/Index.tsx или в компоненте авторизации
import { requestNotificationPermission } from '@/lib/firebase';
import { FUNCTIONS } from '@/lib/func2url';

// После успешной авторизации:
const fcmToken = await requestNotificationPermission();
if (fcmToken && userId) {
  // Сохраняем FCM токен
  await fetch(FUNCTIONS['save-fcm-token'], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId.toString()
    },
    body: JSON.stringify({ fcm_token: fcmToken })
  });
}
```

### 6. Отправка уведомлений при новом сообщении

Модифицируй `backend/send-message/index.py` или `backend/private-messages/index.py`:

```python
# После успешной отправки сообщения:
# Получаем FCM токен получателя
cur.execute(f"SELECT fcm_token, username FROM users WHERE id = {receiver_id}")
receiver = cur.fetchone()

if receiver and receiver[0]:  # Если есть FCM токен
    fcm_token = receiver[0]
    sender_username = "Пользователь"  # Получи из БД
    
    # Отправляем push через внутренний вызов или через requests
    import requests
    requests.post(
        'https://functions.poehali.dev/78814097-be24-4f14-96b8-669fcaaf2e05',
        json={
            'fcm_token': fcm_token,
            'title': f'Сообщение от {sender_username}',
            'body': message_text[:50],  # Первые 50 символов
            'data': {
                'chatUrl': f'/chat/{sender_id}',
                'senderId': sender_id
            }
        }
    )
```

### 7. Добавить иконки приложения

Создай иконки в `public/`:
- `icon-192x192.png` - основная иконка (192x192px)
- `badge-72x72.png` - бейдж для уведомлений (72x72px)

### 8. Зарегистрировать Service Worker

В `src/main.tsx` или `src/App.tsx` добавь:

```typescript
// Регистрация Service Worker для push-уведомлений
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}
```

## Проверка работы:

1. Открой сайт в браузере (нужен HTTPS или localhost)
2. Разреши уведомления когда браузер спросит
3. Проверь в консоли, что FCM токен получен и сохранён
4. Отправь сообщение другому пользователю
5. Получатель должен увидеть push-уведомление (даже если сайт закрыт)

## Отладка:

- **Логи Service Worker**: Chrome DevTools → Application → Service Workers
- **Firebase Console**: Смотри статистику отправленных уведомлений
- **Backend логи**: Проверь логи функций `save-fcm-token` и `send-push`

## Важно:

- Push-уведомления работают только на **HTTPS** (или localhost для разработки)
- Пользователь должен **разрешить уведомления** в браузере
- FCM токены могут **обновляться**, нужно периодически их обновлять
