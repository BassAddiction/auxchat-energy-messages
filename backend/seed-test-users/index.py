import json
import os
import psycopg2
from typing import Dict, Any
import hashlib

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Создать тестовых пользователей с геолокацией для проверки радиуса
    Args: event with httpMethod
          context with request_id
    Returns: HTTP response with created users info
    '''
    print('[SEED v2] Starting seed function')  # Force redeploy
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
    
    dsn = os.environ.get('TIMEWEB_DB_URL')
    if dsn and '?' in dsn:
        dsn += '&sslmode=require'
    elif dsn:
        dsn += '?sslmode=require'
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    password_hash = hashlib.sha256("test123".encode()).hexdigest()
    
    # Тестовые пользователи с координатами разных городов
    test_users = [
        {
            "phone": "+79001111111",
            "username": "Иван из Лянтора",
            "latitude": 61.6167,
            "longitude": 72.1667,
            "city": "Лянтор",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=ivan",
            "distance": "0 км"
        },
        {
            "phone": "+79002222222",
            "username": "Мария из Сургута",
            "latitude": 61.25,
            "longitude": 73.4167,
            "city": "Сургут",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
            "distance": "~60 км"
        },
        {
            "phone": "+79003333333",
            "username": "Петр из Нижневартовска",
            "latitude": 60.9344,
            "longitude": 76.5531,
            "city": "Нижневартовск",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=petr",
            "distance": "~200 км"
        },
        {
            "phone": "+79004444444",
            "username": "Анна из Тюмени",
            "latitude": 57.1522,
            "longitude": 65.5272,
            "city": "Тюмень",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=anna",
            "distance": "~800 км"
        },
        {
            "phone": "+79005555555",
            "username": "Дмитрий из Москвы",
            "latitude": 55.7558,
            "longitude": 37.6173,
            "city": "Москва",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=dmitry",
            "distance": "~2500 км"
        },
        {
            "phone": "+79006666666",
            "username": "Елена из СПБ",
            "latitude": 59.9343,
            "longitude": 30.3351,
            "city": "Санкт-Петербург",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=elena",
            "distance": "~3000 км"
        }
    ]
    
    created_users = []
    
    for user in test_users:
        try:
            # Проверяем существование пользователя
            cur.execute(f"SELECT id FROM users WHERE phone = '{user['phone']}'")
            existing = cur.fetchone()
            
            if existing:
                user_id = existing[0]
                print(f"User {user['username']} already exists with ID {user_id}")
            else:
                # Пробуем создать с city, если не получается - без city
                try:
                    cur.execute(f"""
                        INSERT INTO users (phone, username, password_hash, avatar_url, energy, latitude, longitude, city, created_at)
                        VALUES ('{user['phone']}', '{user['username']}', '{password_hash}', '{user['avatar']}', 1000, {user['latitude']}, {user['longitude']}, '{user['city']}', NOW())
                        RETURNING id
                    """)
                    user_id = cur.fetchone()[0]
                    conn.commit()
                    print(f"Created user {user['username']} with ID {user_id} (with city)")
                except Exception as city_error:
                    print(f"City column not found, creating without it: {city_error}")
                    try:
                        cur.close()
                        conn.close()
                    except:
                        pass
                    # Переподключаемся
                    conn = psycopg2.connect(dsn)
                    cur = conn.cursor()
                    # Создаём без city
                    cur.execute(f"""
                        INSERT INTO users (phone, username, password_hash, avatar_url, energy, latitude, longitude, created_at)
                        VALUES ('{user['phone']}', '{user['username']}', '{password_hash}', '{user['avatar']}', 1000, {user['latitude']}, {user['longitude']}, NOW())
                        RETURNING id
                    """)
                    user_id = cur.fetchone()[0]
                    conn.commit()
                    print(f"Created user {user['username']} with ID {user_id} (without city)")
            
            # Создаём сообщения от пользователя
            messages = [
                f"Привет! Я из города {user['city']} 👋",
                "Тестирую радиус геолокации 📍",
                f"Моё расстояние до Лянтора: {user['distance']}"
            ]
            
            for msg_text in messages:
                safe_text = msg_text.replace("'", "''")
                cur.execute(f"""
                    INSERT INTO messages (user_id, text, created_at)
                    VALUES ({user_id}, '{safe_text}', NOW())
                """)
            
            conn.commit()
            
            created_users.append({
                'id': user_id,
                'username': user['username'],
                'city': user['city'],
                'distance': user['distance']
            })
            
        except Exception as e:
            print(f"Error creating user {user['username']}: {e}")
            conn.rollback()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'created': len(created_users),
            'users': created_users,
            'message': f'Создано {len(created_users)} тестовых пользователей с сообщениями'
        }),
        'isBase64Encoded': False
    }