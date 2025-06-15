try:
    from main import app
except ImportError:
    from .main import app

# This is the entry point for Vercel
handler = app 