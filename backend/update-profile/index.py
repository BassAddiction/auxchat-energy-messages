import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обновление профиля пользователя (статус, имя)
    Args: event с httpMethod, body (status, username)
          context с request_id
    Returns: HTTP ответ с обновленными данными
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'PUT':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    status = body_data.get('status')
    username = body_data.get('username')
    
    print(f'[UPDATE-PROFILE] user_id={user_id}, status={repr(status)}, username={repr(username)}')
    
    if not status and not username:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Status or username required'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('TIMEWEB_DB_URL')
    if dsn and '?' in dsn:
        dsn += '&sslmode=require'
    elif dsn:
        dsn += '?sslmode=require'
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    update_parts = []
    if status is not None:
        safe_status = status.replace("'", "''")
        update_parts.append(f"status = '{safe_status}'")
    
    if username is not None:
        safe_username = username.replace("'", "''")
        update_parts.append(f"username = '{safe_username}'")
    
    update_query = f"UPDATE users SET {', '.join(update_parts)} WHERE id = {int(user_id)} RETURNING id, username, status"
    
    print(f'[UPDATE-PROFILE] Executing: {update_query}')
    cur.execute(update_query)
    result = cur.fetchone()
    print(f'[UPDATE-PROFILE] Result: {result}')
    
    conn.commit()
    cur.close()
    conn.close()
    
    if not result:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'id': result[0],
            'username': result[1],
            'status': result[2]
        }),
        'isBase64Encoded': False
    }