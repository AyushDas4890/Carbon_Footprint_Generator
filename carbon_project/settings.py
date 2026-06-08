"""
Django settings for carbon_project — dev + production hardened.

Production behaviour is triggered by `DJANGO_DEBUG=False`. In that mode we:
  - Require an explicit DJANGO_SECRET_KEY (or auto-generate a random one).
  - Lock down ALLOWED_HOSTS to whatever you set in DJANGO_ALLOWED_HOSTS.
  - Turn on the full HTTPS / HSTS / cookie-security stack.
  - Trust the X-Forwarded-Proto header so Render/Railway/Fly proxies work.

All deploy platforms set environment variables, so config is 100% env-driven.
"""
from pathlib import Path
import os
import secrets
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file in dev. In production env vars come from the hosting platform.
load_dotenv(BASE_DIR / '.env', override=False)


# ===== Core security =====
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() == 'true'

# In dev: use the insecure default to keep first-run friction-free.
# In prod with no key set: generate a fresh random one in memory (will
# invalidate sessions on every restart — set DJANGO_SECRET_KEY in your
# host's env to avoid that).
_DEFAULT_DEV_KEY = 'django-insecure-h@!5)vc50up_y*iheb#_ds#pnvlb#_zm2jw%wnlzq*r!yj_ukn'
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY') or (
    _DEFAULT_DEV_KEY if DEBUG else secrets.token_urlsafe(50)
)

# Hosts allowed to serve this app. Set DJANGO_ALLOWED_HOSTS to a comma-separated
# list in production, e.g. "c4future.onrender.com,c4future.com".
_hosts_env = os.getenv('DJANGO_ALLOWED_HOSTS', '').strip()
if DEBUG:
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = [h.strip() for h in _hosts_env.split(',') if h.strip()] or ['*']

# Render injects RENDER_EXTERNAL_HOSTNAME automatically — pick it up.
_render_host = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

# CSRF: trust the same origins. Most platforms put us behind HTTPS.
CSRF_TRUSTED_ORIGINS = [
    f"https://{h}" for h in ALLOWED_HOSTS if h not in ('*', 'localhost', '127.0.0.1')
]


# ===== Applications =====
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'core',
    'predictor',
    'advisor',
    'rest_framework',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # serves /static/ in prod
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'carbon_project.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

WSGI_APPLICATION = 'carbon_project.wsgi.application'


# ===== Database =====
# Default: SQLite. Set DATABASE_URL to swap to Postgres (use dj-database-url).
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
_database_url = os.getenv('DATABASE_URL')
if _database_url:
    try:
        import dj_database_url
        DATABASES['default'] = dj_database_url.parse(_database_url, conn_max_age=600)
    except ImportError:
        # Falling back to SQLite if dj-database-url isn't installed.
        pass


AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# ===== Static files =====
STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ===== Production HTTPS / cookie security =====
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = os.getenv('DJANGO_SSL_REDIRECT', 'True').lower() == 'true'
    SECURE_HSTS_SECONDS = int(os.getenv('DJANGO_HSTS_SECONDS', '3600'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = False
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = 'same-origin'
    X_FRAME_OPTIONS = 'DENY'


# ===== Logging =====
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {'format': '[{asctime}] {levelname} {name}: {message}', 'style': '{'},
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'},
    },
    'root': {'handlers': ['console'], 'level': 'INFO' if not DEBUG else 'DEBUG'},
    'loggers': {
        'django.utils.autoreload': {'level': 'WARNING'},
        'urllib3': {'level': 'WARNING'},
        'httpx': {'level': 'WARNING'},
        'chromadb': {'level': 'WARNING'},
        'sentence_transformers': {'level': 'WARNING'},
    },
}

# Optional Sentry integration. Set SENTRY_DSN env to enable.
_sentry_dsn = os.getenv('SENTRY_DSN')
if _sentry_dsn:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        sentry_sdk.init(
            dsn=_sentry_dsn,
            integrations=[DjangoIntegration()],
            traces_sample_rate=float(os.getenv('SENTRY_TRACES_RATE', '0.0')),
            send_default_pii=False,
            environment='production' if not DEBUG else 'development',
        )
    except ImportError:
        pass


# ===== RAG / Advisor Configuration =====
ADVISOR_CONFIG = {
    'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY', ''),
    'OPENAI_BASE_URL': os.getenv('OPENAI_BASE_URL', '').strip() or None,
    'LLM_MODEL': os.getenv('ADVISOR_LLM_MODEL', 'gpt-4o-mini'),
    'EMBED_MODEL': os.getenv('ADVISOR_EMBED_MODEL', 'sentence-transformers/all-MiniLM-L6-v2'),
    'CHROMA_DIR': str(BASE_DIR / os.getenv('ADVISOR_CHROMA_DIR', 'advisor/chroma_store').lstrip('./')),
    'COLLECTION_NAME': 'sustainability_kb',
    'TOP_K': int(os.getenv('ADVISOR_TOP_K', '4')),
    'CHUNK_SIZE': 800,
    'CHUNK_OVERLAP': 120,
}
