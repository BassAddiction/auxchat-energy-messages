'''
Business: Update user last activity timestamp
Args: event with httpMethod, headers (X-User-Id)
Returns: HTTP response with success status
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
    
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters') or {}
    
    # Пытаемся получить user_id из разных источников:
    # 1. Body JSON (приоритет - nginx не трогает body)
    # 2. Query параметр (может быть отрезан nginx)
    # 3. X-Auth-User-Id заголовок (альтернатива)
    # 4. X-User-Id заголовок (перезаписывается nginx на auxchat.ru)
    user_id_str = None
    
    # Пробуем достать из body
    body_str = event.get('body', '')
    print(f'[UPDATE-ACTIVITY] RAW BODY: {repr(body_str)}')
    print(f'[UPDATE-ACTIVITY] BODY LENGTH: {len(body_str) if body_str else 0}')
    print(f'[UPDATE-ACTIVITY] isBase64Encoded: {event.get("isBase64Encoded")}')
    
    if body_str:
        try:
            body_data = json.loads(body_str)
            user_id_str = str(body_data.get('user_id', ''))
            print(f'[UPDATE-ACTIVITY] user_id from body: {user_id_str}')
        except Exception as e:
            print(f'[UPDATE-ACTIVITY] Failed to parse body JSON: {e}')
    
    # Если в body нет, пробуем другие источники
    if not user_id_str:
        user_id_str = (
            query_params.get('user_id') or 
            headers.get('X-Auth-User-Id') or 
            headers.get('x-auth-user-id') or
            headers.get('X-User-Id') or 
            headers.get('x-user-id')
        )
    
    print(f'[UPDATE-ACTIVITY] user_id from query: {query_params.get("user_id")}')
    print(f'[UPDATE-ACTIVITY] user_id from X-User-Id: {headers.get("X-User-Id")}')
    print(f'[UPDATE-ACTIVITY] Final user_id_str: {user_id_str}')
    
    if not user_id_str:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id required (body JSON or header)'}),
            'isBase64Encoded': False
        }
    
    user_id = int(user_id_str)
    print(f'[UPDATE-ACTIVITY] Starting for user_id={user_id}')
    
    dsn = os.environ.get('TIMEWEB_DB_URL')
    # Показываем только host и database name (без пароля)
    dsn_safe = dsn.split('@')[1] if dsn and '@' in dsn else 'NO_DSN'
    print(f'[UPDATE-ACTIVITY] DSN exists: {bool(dsn)}, connecting to: {dsn_safe}')
    
    if dsn and '?' in dsn:
        dsn += '&sslmode=require'
    elif dsn:
        dsn += '?sslmode=require'
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    print(f'[UPDATE-ACTIVITY] Connected to DB')
    
    safe_user_id = str(user_id).replace("'", "''")
    # Use CURRENT_TIMESTAMP AT TIME ZONE 'UTC' to ensure consistent timezone
    query = f"UPDATE users SET last_activity = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') WHERE id = '{safe_user_id}'"
    print(f'[UPDATE-ACTIVITY] Executing: {query}')
    
    cur.execute(query)
    rows_affected = cur.rowcount
    print(f'[UPDATE-ACTIVITY] Rows affected: {rows_affected}')
    
    conn.commit()
    print(f'[UPDATE-ACTIVITY] Committed')
    
    cur.close()
    conn.close()
    print(f'[UPDATE-ACTIVITY] Connection closed')
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }