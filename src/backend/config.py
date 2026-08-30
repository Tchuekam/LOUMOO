# -*- coding: utf-8 -*-
"""
LOUMOO Master Backend Configuration (Python Runtime)
Loads settings from .env.local / .env for Python tools and scripts.
"""

import os
from pathlib import Path

def load_dotenv_custom():
    base_dir = Path(__file__).resolve().parent.parent.parent
    for env_filename in ['.env.local', '.env']:
        env_file = base_dir / env_filename
        if env_file.exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#') or '=' not in line:
                        continue
                    key, val = line.split('=', 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key not in os.environ:
                        os.environ[key] = val
            break

load_dotenv_custom()

# Configuration mapping
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://vhojbhvaasjvolcfkobz.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
REDIS_URL = os.getenv('REDIS_URL', '')
SENTRY_DSN = os.getenv('SENTRY_DSN', '')
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY', '')
POSTHOG_API_KEY = os.getenv('POSTHOG_API_KEY', '')
AISSTREAM_API_KEY = os.getenv('AISSTREAM_API_KEY', '')
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY', '')

def init_sentry():
    """Initializes Sentry SDK if installed and DSN configured"""
    if not SENTRY_DSN:
        return False
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            traces_sample_rate=1.0,
            send_default_pii=True,
            environment=os.getenv('NODE_ENV', 'development')
        )
        print("[Sentry] Python SDK initialized successfully.")
        return True
    except ImportError:
        return False
