"""
Standalone функция для отправки push-уведомлений через Firebase Cloud Messaging

Эту функцию можно разместить на любом сервере (Flask, FastAPI, Django и т.д.)

Требования:
1. pip install requests
2. Получить FIREBASE_SERVER_KEY из Firebase Console
3. У пользователя в БД должен быть сохранён fcm_token

Использование:
    send_push_notification(
        fcm_token='device_fcm_token_here',
        title='Новое сообщение от Юры',
        body='Привет! Как дела?',
        data={'chatUrl': '/chat/123', 'senderId': '123'}
    )
"""

import requests
import json


def send_push_notification(fcm_token: str, title: str, body: str, data: dict = None) -> bool:
    """
    Отправляет push-уведомление через Firebase Cloud Messaging
    
    Args:
        fcm_token: FCM токен устройства получателя
        title: Заголовок уведомления
        body: Текст уведомления
        data: Дополнительные данные (словарь)
    
    Returns:
        True если успешно отправлено, False если ошибка
    """
    
    # ВАЖНО: Получить из Firebase Console → Project Settings → Cloud Messaging → Server key
    FIREBASE_SERVER_KEY = 'YOUR_FIREBASE_SERVER_KEY_HERE'
    
    if not fcm_token or not FIREBASE_SERVER_KEY:
        print('[PUSH] Missing FCM token or server key')
        return False
    
    # Firebase Cloud Messaging endpoint
    fcm_url = 'https://fcm.googleapis.com/fcm/send'
    
    headers = {
        'Authorization': f'key={FIREBASE_SERVER_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'to': fcm_token,
        'notification': {
            'title': title,
            'body': body,
            'icon': '/icon-192x192.png',  # URL иконки приложения
            'click_action': data.get('chatUrl', '/messages') if data else '/messages'
        },
        'data': data or {}
    }
    
    try:
        response = requests.post(fcm_url, headers=headers, json=payload, timeout=10)
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get('success') == 1:
            print(f'[PUSH] Successfully sent to {fcm_token[:20]}...')
            return True
        else:
            print(f'[PUSH] Failed: {response_data}')
            return False
            
    except Exception as e:
        print(f'[PUSH] Exception: {e}')
        return False


# ============================================
# Пример интеграции с разными фреймворками
# ============================================


# 1. Flask пример
"""
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/send-message', methods=['POST'])
def send_message():
    data = request.json
    receiver_id = data['receiver_id']
    message_text = data['text']
    sender_username = data['sender_username']
    
    # Сохраняем сообщение в БД
    # ... ваш код сохранения ...
    
    # Получаем FCM токен получателя из БД
    fcm_token = get_user_fcm_token(receiver_id)  # ваша функция
    
    if fcm_token:
        send_push_notification(
            fcm_token=fcm_token,
            title=f'💬 {sender_username}',
            body=message_text[:50],
            data={
                'chatUrl': f'/chat/{data["sender_id"]}',
                'senderId': str(data['sender_id'])
            }
        )
    
    return jsonify({'success': True})
"""


# 2. FastAPI пример
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class SendMessageRequest(BaseModel):
    receiver_id: int
    text: str
    sender_username: str
    sender_id: int

@app.post('/send-message')
async def send_message(req: SendMessageRequest):
    # Сохраняем сообщение в БД
    # ... ваш код сохранения ...
    
    # Получаем FCM токен получателя из БД
    fcm_token = await get_user_fcm_token(req.receiver_id)
    
    if fcm_token:
        send_push_notification(
            fcm_token=fcm_token,
            title=f'💬 {req.sender_username}',
            body=req.text[:50],
            data={
                'chatUrl': f'/chat/{req.sender_id}',
                'senderId': str(req.sender_id)
            }
        )
    
    return {'success': True}
"""


# 3. Django пример
"""
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json

@require_POST
def send_message(request):
    data = json.loads(request.body)
    receiver_id = data['receiver_id']
    message_text = data['text']
    sender_username = data['sender_username']
    
    # Сохраняем сообщение в БД через Django ORM
    # Message.objects.create(...)
    
    # Получаем FCM токен получателя
    try:
        receiver = User.objects.get(id=receiver_id)
        fcm_token = receiver.fcm_token
        
        if fcm_token:
            send_push_notification(
                fcm_token=fcm_token,
                title=f'💬 {sender_username}',
                body=message_text[:50],
                data={
                    'chatUrl': f'/chat/{data["sender_id"]}',
                    'senderId': str(data['sender_id'])
                }
            )
    except User.DoesNotExist:
        pass
    
    return JsonResponse({'success': True})
"""


# 4. Простой пример с PostgreSQL
"""
import psycopg2

def send_message_with_push(sender_id, receiver_id, message_text, sender_username):
    # Подключение к БД
    conn = psycopg2.connect(
        host='your_host',
        database='your_db',
        user='your_user',
        password='your_password'
    )
    cur = conn.cursor()
    
    # Сохраняем сообщение
    cur.execute(
        "INSERT INTO messages (sender_id, receiver_id, text) VALUES (%s, %s, %s)",
        (sender_id, receiver_id, message_text)
    )
    
    # Получаем FCM токен получателя
    cur.execute("SELECT fcm_token FROM users WHERE id = %s", (receiver_id,))
    result = cur.fetchone()
    
    conn.commit()
    cur.close()
    conn.close()
    
    # Отправляем push если токен есть
    if result and result[0]:
        fcm_token = result[0]
        send_push_notification(
            fcm_token=fcm_token,
            title=f'💬 {sender_username}',
            body=message_text[:50],
            data={
                'chatUrl': f'/chat/{sender_id}',
                'senderId': str(sender_id)
            }
        )
"""


if __name__ == '__main__':
    # Тест функции
    print('Testing push notification...')
    
    # Замени на реальные данные для теста
    test_fcm_token = 'YOUR_TEST_FCM_TOKEN_HERE'
    
    result = send_push_notification(
        fcm_token=test_fcm_token,
        title='Тестовое уведомление',
        body='Проверка работы push-уведомлений',
        data={'chatUrl': '/test', 'senderId': '999'}
    )
    
    print(f'Result: {"Success" if result else "Failed"}')
