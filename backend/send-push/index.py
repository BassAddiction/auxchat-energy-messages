import json
import os
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Отправка push-уведомления через Firebase Cloud Messaging
    Args: event с body (fcm_token, title, body, data)
    Returns: HTTP ответ со статусом отправки
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    fcm_token = body_data.get('fcm_token')
    title = body_data.get('title', 'Новое сообщение')
    message_body = body_data.get('body', 'У вас новое сообщение')
    data = body_data.get('data', {})
    
    if not fcm_token:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'FCM token required'}),
            'isBase64Encoded': False
        }
    
    # Получаем Firebase Server Key из секретов
    firebase_server_key = os.environ.get('FIREBASE_SERVER_KEY')
    if not firebase_server_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Firebase server key not configured'}),
            'isBase64Encoded': False
        }
    
    # Отправляем через Firebase Cloud Messaging API
    fcm_url = 'https://fcm.googleapis.com/fcm/send'
    headers = {
        'Authorization': f'key={firebase_server_key}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'to': fcm_token,
        'notification': {
            'title': title,
            'body': message_body,
            'icon': '/icon-192x192.png',
            'click_action': data.get('chatUrl', '/messages')
        },
        'data': data
    }
    
    try:
        response = requests.post(fcm_url, headers=headers, json=payload, timeout=10)
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get('success') == 1:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Push notification sent'}),
                'isBase64Encoded': False
            }
        else:
            print(f'[SEND-PUSH] FCM error: {response_data}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Failed to send push notification', 'details': response_data}),
                'isBase64Encoded': False
            }
    except Exception as e:
        print(f'[SEND-PUSH] Exception: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
