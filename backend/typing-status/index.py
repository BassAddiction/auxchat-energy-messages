import json
import os
from typing import Dict, Any
from datetime import datetime, timedelta

# Временное хранилище статусов печати (в памяти)
# Структура: {user_id: {'typing_to': receiver_id, 'timestamp': datetime}}
typing_statuses: Dict[int, Dict[str, Any]] = {}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление статусом "печатает..." в чате
    GET: проверить печатает ли пользователь
    POST: установить статус печати
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id_str = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id_str:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    user_id = int(user_id_str)
    now = datetime.now()
    
    # Очищаем устаревшие статусы (старше 5 секунд)
    expired_users = []
    for uid, data in typing_statuses.items():
        if now - data['timestamp'] > timedelta(seconds=5):
            expired_users.append(uid)
    for uid in expired_users:
        del typing_statuses[uid]
    
    if method == 'GET':
        # Проверяем печатает ли указанный пользователь нам
        query_params = event.get('queryStringParameters', {}) or {}
        check_user_id = query_params.get('user_id')
        
        if not check_user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user_id query parameter required'}),
                'isBase64Encoded': False
            }
        
        check_user_id = int(check_user_id)
        typing_data = typing_statuses.get(check_user_id, {})
        
        is_typing = (
            typing_data.get('typing_to') == user_id and
            now - typing_data.get('timestamp', datetime.min) < timedelta(seconds=3)
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'is_typing': is_typing,
                'typing_to': typing_data.get('typing_to') if is_typing else None
            }),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        typing_to = body_data.get('typing_to')
        
        if not typing_to:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'typing_to required'}),
                'isBase64Encoded': False
            }
        
        typing_to = int(typing_to)
        typing_statuses[user_id] = {
            'typing_to': typing_to,
            'timestamp': now
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
