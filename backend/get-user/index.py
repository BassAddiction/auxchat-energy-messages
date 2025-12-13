import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get user data by ID with geolocation and city
    Args: event with httpMethod, queryStringParameters (user_id)
          context with request_id
    Returns: HTTP response with user data including latitude, longitude, city
    '''
    print('[GET-USER v5] Handler called - rollback to working version')
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 204,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Получаем user_id из query параметров или из заголовка X-User-Id
    params = event.get('queryStringParameters') or {}
    headers = event.get('headers') or {}
    user_id = params.get('user_id') or headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('TIMEWEB_DB_URL')
    if dsn and '?' in dsn:
        dsn += '&sslmode=require'
    elif dsn:
        dsn += '?sslmode=require'
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    # Use simple query protocol - user_id is already validated as integer
    try:
        # Convert to int to ensure it's safe
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid user ID'}),
            'isBase64Encoded': False
        }
    
    # Try with status and city columns first, fallback if they don't exist
    try:
        cur.execute(
            f"SELECT id, phone, username, avatar_url, energy, is_banned, bio, last_activity, latitude, longitude, city, status FROM users WHERE id = {user_id_int}"
        )
        row = cur.fetchone()
        has_city = True
        has_status = True
    except Exception as e:
        print(f'[GET-USER] Error with city/status columns: {e}, reconnecting for fallback')
        # Close failed connection and create new one
        try:
            cur.close()
            conn.close()
        except:
            pass
        # Reconnect
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, phone, username, avatar_url, energy, is_banned, bio, last_activity, latitude, longitude FROM users WHERE id = {user_id_int}"
        )
        row = cur.fetchone()
        has_city = False
        has_status = False
    
    cur.close()
    conn.close()
    
    if not row:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'}),
            'isBase64Encoded': False
        }
    
    # Helper function to clean strings from control characters
    def clean_string(s):
        if not s:
            return ''
        # Remove control characters except tab, newline, carriage return
        import re
        return re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', str(s))
    
    # Extract custom user status (текстовый статус типа "привет настроение так то")
    user_custom_status = ''
    if has_status and len(row) > 11 and row[11]:
        user_custom_status = str(row[11])
    
    # Compute online/offline status based on last_activity
    from datetime import datetime, timedelta
    last_activity = row[7]  # last_activity column
    is_online = False
    last_seen = None
    if last_activity:
        if isinstance(last_activity, str):
            last_activity = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
        now = datetime.now(last_activity.tzinfo) if last_activity.tzinfo else datetime.now()
        time_diff = now - last_activity
        # Онлайн только если активность была меньше 15 секунд назад (как в WhatsApp)
        is_online = time_diff < timedelta(seconds=15)
        # Сохраняем время последней активности для отображения
        last_seen = last_activity.isoformat() if last_activity else None
    
    result_data = {
        'id': row[0],
        'phone': clean_string(row[1]),
        'username': clean_string(row[2]),
        'avatar': clean_string(row[3]) if row[3] else '',
        'energy': row[4],
        'is_admin': False,
        'is_banned': row[5] if row[5] is not None else False,
        'bio': clean_string(row[6]) if row[6] else '',
        'status': 'online' if is_online else 'offline',
        'last_seen': last_seen,
        'custom_status': clean_string(user_custom_status),
        'latitude': float(row[8]) if len(row) > 8 and row[8] is not None else None,
        'longitude': float(row[9]) if len(row) > 9 and row[9] is not None else None,
        'city': clean_string(row[10]) if has_city and len(row) > 10 and row[10] else ''
    }
    
    # Debug: log raw data before JSON encoding
    print(f'[GET-USER] Raw result_data: {repr(result_data)}')
    
    try:
        body_json = json.dumps(result_data)
        print(f'[GET-USER] JSON body length: {len(body_json)}')
    except Exception as e:
        print(f'[GET-USER] JSON encode error: {e}')
        print(f'[GET-USER] Problematic data: {result_data}')
        raise
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': body_json,
        'isBase64Encoded': False
    }