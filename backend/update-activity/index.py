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
    # 1. Query параметр (приоритет - не перезаписывается nginx)
    # 2. X-Auth-User-Id заголовок (альтернатива)
    # 3. X-User-Id заголовок (может быть перезаписан nginx)
    user_id_str = (
        query_params.get('user_id') or 
        headers.get('X-Auth-User-Id') or 
        headers.get('x-auth-user-id') or
        headers.get('X-User-Id') or 
        headers.get('x-user-id')
    )
    
    print(f'[UPDATE-ACTIVITY] user_id from query: {query_params.get("user_id")}')
    print(f'[UPDATE-ACTIVITY] user_id from X-Auth-User-Id: {headers.get("X-Auth-User-Id")}')
    print(f'[UPDATE-ACTIVITY] user_id from X-User-Id: {headers.get("X-User-Id")}')
    print(f'[UPDATE-ACTIVITY] Final user_id_str: {user_id_str}')
    
    if not user_id_str:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id required (query param or X-Auth-User-Id header)'}),
            'isBase64Encoded': False
        }
    
    user_id = int(user_id_str)
    print(f'[UPDATE-ACTIVITY] Starting for user_id={user_id}')
    
    dsn = os.environ.get('TIMEWEB_DB_URL')
    print(f'[UPDATE-ACTIVITY] DSN exists: {bool(dsn)}, starts with postgresql: {dsn.startswith("postgresql://") if dsn else False}')
    
    if dsn and '?' in dsn:
        dsn += '&sslmode=require'
    elif dsn:
        dsn += '?sslmode=require'
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    print(f'[UPDATE-ACTIVITY] Connected to DB')
    
    safe_user_id = str(user_id).replace("'", "''")
    query = f"UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = '{safe_user_id}'"
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