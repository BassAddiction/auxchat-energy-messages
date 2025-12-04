"""
ASGI entry point for Timeweb App Platform
Wraps Flask WSGI app into ASGI for compatibility
"""
from asgiref.wsgi import WsgiToAsgi
from main import app

# Convert Flask WSGI app to ASGI
application = WsgiToAsgi(app)
