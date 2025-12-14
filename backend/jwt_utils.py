import jwt
import os
from typing import Dict, Any, Optional

def verify_jwt_token(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token from Authorization header
    Returns decoded token payload or None if invalid
    """
    headers = event.get('headers', {})
    auth_header = headers.get('Authorization') or headers.get('authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.replace('Bearer ', '').strip()
    jwt_secret = os.environ.get('JWT_SECRET', 'auxchat-secret-key-2025')
    
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        print('[JWT] Token expired')
        return None
    except jwt.InvalidTokenError:
        print('[JWT] Invalid token')
        return None

def get_user_id_from_request(event: Dict[str, Any]) -> Optional[str]:
    """
    Extract user_id from JWT token or fallback to X-User-Id header
    Returns user_id as string or None
    """
    # Try JWT token first
    token_payload = verify_jwt_token(event)
    if token_payload and 'user_id' in token_payload:
        return str(token_payload['user_id'])
    
    # Fallback to X-User-Id header for backward compatibility
    headers = event.get('headers', {})
    return headers.get('X-User-Id') or headers.get('x-user-id')
