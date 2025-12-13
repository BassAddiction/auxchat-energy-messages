'''
Business: Send and receive private messages between users
Args: event with httpMethod, headers (X-User-Id), body with receiverId/text, query params
Returns: HTTP response with messages or send confirmation
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    print(f'=== HANDLER START ===')
    print(f'Event: {json.dumps(event)}')
    method: str = event.get('httpMethod', 'GET')
    print(f'Method: {method}')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        headers = event.get('headers', {})
        user_id_str = headers.get('X-User-Id') or headers.get('x-user-id')
        
        if not user_id_str:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'X-User-Id header required'}),
                'isBase64Encoded': False
            }
        
        user_id = int(user_id_str)
        print(f'User ID: {user_id}')
        dsn = os.environ.get('TIMEWEB_DB_URL')
        if dsn and '?' in dsn:
            dsn += '&sslmode=require'
        elif dsn:
            dsn += '?sslmode=require'
        print(f'Connecting to DB with DSN: {dsn[:30]}...')
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        print(f'DB connected successfully')
        
        if method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            other_user_id_str = query_params.get('otherUserId')
            limit_str = query_params.get('limit', '100')
            
            if not other_user_id_str:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'otherUserId query param required'}),
                    'isBase64Encoded': False
                }
            
            other_user_id = int(other_user_id_str)
            limit = int(limit_str)
            print(f'Other user ID: {other_user_id}')
            print(f'Limit: {limit}')
            
            # Load messages with text, voice and images
            # Try to check if image_url column exists first
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'private_messages' AND column_name = 'image_url'")
            has_image_url = len(cur.fetchall()) > 0
            
            # If column doesn't exist, create it
            if not has_image_url:
                try:
                    cur.execute("ALTER TABLE private_messages ADD COLUMN image_url TEXT")
                    conn.commit()
                    has_image_url = True
                    print('Created image_url column')
                except Exception as e:
                    print(f'Could not create image_url column: {e}')
            
            if has_image_url:
                # Используем подзапрос: берём последние N сообщений (DESC) и переворачиваем обратно (ASC)
                query = f"""
                    SELECT * FROM (
                        SELECT pm.id, pm.sender_id, pm.receiver_id, pm.text, pm.is_read, pm.created_at,
                               u.username, NULL as avatar_url, pm.voice_url, pm.voice_duration, pm.image_url
                        FROM private_messages pm
                        JOIN users u ON u.id = pm.sender_id
                        WHERE (pm.sender_id = {user_id} AND pm.receiver_id = {other_user_id}) 
                           OR (pm.sender_id = {other_user_id} AND pm.receiver_id = {user_id})
                        ORDER BY pm.created_at DESC
                        LIMIT {limit}
                    ) AS last_messages
                    ORDER BY created_at ASC
                """
            else:
                # Fallback without image_url if column doesn't exist
                query = f"""
                    SELECT * FROM (
                        SELECT pm.id, pm.sender_id, pm.receiver_id, pm.text, pm.is_read, pm.created_at,
                               u.username, NULL as avatar_url, pm.voice_url, pm.voice_duration, NULL as image_url
                        FROM private_messages pm
                        JOIN users u ON u.id = pm.sender_id
                        WHERE (pm.sender_id = {user_id} AND pm.receiver_id = {other_user_id}) 
                           OR (pm.sender_id = {other_user_id} AND pm.receiver_id = {user_id})
                        ORDER BY pm.created_at DESC
                        LIMIT {limit}
                    ) AS last_messages
                    ORDER BY created_at ASC
                """
            print(f'Executing query...')
            cur.execute(query)
            print(f'Query executed')
            
            rows = cur.fetchall()
            print(f'Fetched {len(rows)} rows')
            
            messages = []
            for row in rows:
                created_at = row[5]
                if hasattr(created_at, 'isoformat'):
                    # Добавляем UTC timezone к времени
                    if created_at.tzinfo is None:
                        from datetime import timezone
                        created_at = created_at.replace(tzinfo=timezone.utc)
                    created_at_str = created_at.isoformat()
                else:
                    created_at_str = str(created_at) + 'Z'
                
                messages.append({
                    'id': row[0],
                    'senderId': row[1],
                    'receiverId': row[2],
                    'text': row[3],
                    'isRead': row[4],
                    'createdAt': created_at_str,
                    'sender': {'username': row[6] if row[6] else '', 'avatarUrl': row[7] if row[7] else None},
                    'voiceUrl': row[8] if row[8] else None,
                    'voiceDuration': row[9] if row[9] else None,
                    'imageUrl': row[10] if row[10] else None
                })
            
            print(f'Prepared {len(messages)} messages for response')
            
            update_query = f"""
                UPDATE private_messages 
                SET is_read = TRUE 
                WHERE receiver_id = {user_id} AND sender_id = {other_user_id} AND is_read = FALSE
            """
            cur.execute(update_query)
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            receiver_id = body_data.get('receiverId')
            text = body_data.get('text', '').strip()
            voice_url = body_data.get('voiceUrl', '').strip()
            voice_duration = body_data.get('voiceDuration')
            image_url = body_data.get('imageUrl', '').strip()
            
            if not receiver_id or (not text and not voice_url and not image_url):
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'receiverId and (text or voiceUrl or imageUrl) required'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем блокировку в обе стороны
            block_check_query = f"""
                SELECT COUNT(*) FROM blacklist
                WHERE (user_id = {user_id} AND blocked_user_id = {receiver_id})
                   OR (user_id = {receiver_id} AND blocked_user_id = {user_id})
            """
            cur.execute(block_check_query)
            is_blocked = cur.fetchone()[0] > 0
            
            if is_blocked:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Вы не можете отправлять сообщения этому пользователю'}),
                    'isBase64Encoded': False
                }
            
            if image_url:
                escaped_image_url = image_url.replace("'", "''")
                escaped_text = text.replace("'", "''") if text else ''
                insert_query = f"""
                    INSERT INTO private_messages 
                    (sender_id, receiver_id, text, image_url) 
                    VALUES ({user_id}, {receiver_id}, '{escaped_text}', '{escaped_image_url}') 
                    RETURNING id
                """
            elif voice_url:
                escaped_voice_url = voice_url.replace("'", "''")
                if text:
                    escaped_text = text.replace("'", "''")
                    insert_query = f"""
                        INSERT INTO private_messages 
                        (sender_id, receiver_id, text, voice_url, voice_duration) 
                        VALUES ({user_id}, {receiver_id}, '{escaped_text}', '{escaped_voice_url}', {voice_duration if voice_duration else 'NULL'}) 
                        RETURNING id
                    """
                else:
                    insert_query = f"""
                        INSERT INTO private_messages 
                        (sender_id, receiver_id, text, voice_url, voice_duration) 
                        VALUES ({user_id}, {receiver_id}, '', '{escaped_voice_url}', {voice_duration if voice_duration else 'NULL'}) 
                        RETURNING id
                    """
            else:
                escaped_text = text.replace("'", "''")
                insert_query = f"""
                    INSERT INTO private_messages 
                    (sender_id, receiver_id, text) 
                    VALUES ({user_id}, {receiver_id}, '{escaped_text}') 
                    RETURNING id
                """
            cur.execute(insert_query)
            message_id = cur.fetchone()[0]
            
            # Обновляем last_activity отправителя
            safe_user_id_update = str(user_id).replace("'", "''")
            cur.execute(
                f"UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = '{safe_user_id_update}'"
            )
            
            # Получаем данные получателя для отправки push-уведомления
            cur.execute(f"SELECT fcm_token, username FROM users WHERE id = {receiver_id}")
            receiver_data = cur.fetchone()
            
            # Получаем имя отправителя
            cur.execute(f"SELECT username FROM users WHERE id = {user_id}")
            sender_data = cur.fetchone()
            sender_username = sender_data[0] if sender_data else 'Пользователь'
            
            conn.commit()
            cur.close()
            conn.close()
            
            # Если у получателя есть FCM токен - отправляем push
            if receiver_data and receiver_data[0]:
                try:
                    import requests
                    fcm_token = receiver_data[0]
                    
                    # Формируем текст уведомления
                    if image_url:
                        notification_text = '📷 Изображение'
                    elif voice_url:
                        notification_text = '🎤 Голосовое сообщение'
                    else:
                        notification_text = text[:50] + ('...' if len(text) > 50 else '')
                    
                    # Отправляем через нашу функцию send-push
                    push_url = 'https://functions.poehali.dev/78814097-be24-4f14-96b8-669fcaaf2e05'
                    requests.post(
                        push_url,
                        json={
                            'fcm_token': fcm_token,
                            'title': f'💬 {sender_username}',
                            'body': notification_text,
                            'data': {
                                'chatUrl': f'/chat/{user_id}',
                                'senderId': str(user_id)
                            }
                        },
                        timeout=3  # Не ждём долго, чтобы не тормозить ответ
                    )
                    print(f'[PUSH] Sent notification to user {receiver_id}')
                except Exception as e:
                    # Если push не отправился - не падаем, просто логируем
                    print(f'[PUSH] Failed to send notification: {e}')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'messageId': message_id}),
                'isBase64Encoded': False
            }
        
        if method == 'DELETE':
            query_params = event.get('queryStringParameters', {}) or {}
            message_id_str = query_params.get('messageId')
            
            if not message_id_str:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'messageId query param required'}),
                    'isBase64Encoded': False
                }
            
            message_id = int(message_id_str)
            
            # Проверяем, что сообщение принадлежит текущему пользователю
            cur.execute(f"SELECT sender_id FROM private_messages WHERE id = {message_id}")
            result = cur.fetchone()
            
            if not result:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Message not found'}),
                    'isBase64Encoded': False
                }
            
            sender_id = result[0]
            
            if sender_id != user_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'You can only delete your own messages'}),
                    'isBase64Encoded': False
                }
            
            # Удаляем сообщение
            cur.execute(f"DELETE FROM private_messages WHERE id = {message_id}")
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f'Error in private-messages: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }