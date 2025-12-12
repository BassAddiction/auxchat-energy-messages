import json
import os
import boto3
import base64
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Загружает фотографию пользователя в Timeweb S3 хранилище
    Args: event - dict с httpMethod, body (base64 изображение)
    Returns: HTTP response с публичным URL загруженного файла
    '''
    print('[UPLOAD-PHOTO] Using Timeweb S3 storage')
    method: str = event.get('httpMethod', 'POST')
    
    # Handle CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    # Parse request
    body_str = event.get('body') or '{}'
    print(f'[UPLOAD] Body string length: {len(body_str)}')
    body_data = json.loads(body_str) if body_str else {}
    print(f'[UPLOAD] Body data keys: {list(body_data.keys())}')
    
    file_base64 = body_data.get('fileData') or body_data.get('audioData') or body_data.get('file')
    content_type = body_data.get('contentType', 'image/jpeg')
    print(f'[UPLOAD] Content type: {content_type}')
    print(f'[UPLOAD] File base64 length: {len(file_base64) if file_base64 else 0}')
    
    if not file_base64:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No file data provided'})
        }
    
    # Decode base64 (strip data:image/... prefix if present)
    try:
        if ',' in file_base64:
            file_base64 = file_base64.split(',')[1]
        file_data = base64.b64decode(file_base64)
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Invalid base64: {str(e)}'})
        }
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    extension = content_type.split('/')[-1]
    filename = f'photos/{timestamp}.{extension}'
    
    # Upload to Timeweb S3
    s3 = boto3.client('s3',
        endpoint_url=os.environ['TIMEWEB_S3_ENDPOINT'],
        aws_access_key_id=os.environ['TIMEWEB_S3_ACCESS_KEY'],
        aws_secret_access_key=os.environ['TIMEWEB_S3_SECRET_KEY'],
        region_name=os.environ.get('TIMEWEB_S3_REGION', 'ru-1')
    )
    
    bucket_name = os.environ['TIMEWEB_S3_BUCKET_NAME']
    
    try:
        s3.put_object(
            Bucket=bucket_name,
            Key=filename,
            Body=file_data,
            ContentType=content_type,
            ACL='public-read'  # Делаем файл публично доступным
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Upload failed: {str(e)}'})
        }
    
    # Generate public URL for Timeweb S3
    # Format: https://s3.timeweb.cloud/{bucket}/{filename}
    access_key = os.environ['TIMEWEB_S3_ACCESS_KEY']
    public_url = f"https://s3.twcstorage.ru/{access_key}/{bucket_name}/{filename}"
    print(f'[UPLOAD-PHOTO] Uploaded to: {public_url}')
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'url': public_url, 'fileUrl': public_url})
    }