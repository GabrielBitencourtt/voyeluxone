from fastapi import Request, HTTPException, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

# Configuração do rate limiter
limiter = Limiter(
    key_func=get_remote_address,  # Baseado no IP
    default_limits=["100/hour"],   # Limite padrão
    storage_uri=settings.REDIS_CONNECTION_URL,  # Usa Redis
)

async def rate_limit_middleware(request: Request, call_next):
    """Middleware para rate limiting (alternativa)"""
    response = await call_next(request)
    return response

# Funções auxiliares
async def check_login_limit(request: Request):
    """Verifica limite de tentativas de login"""
    await limiter.limit(settings.RATE_LIMIT_LOGIN)(request)

async def check_tfa_limit(request: Request):
    """Verifica limite de tentativas 2FA"""
    await limiter.limit(settings.RATE_LIMIT_TFA)(request)

async def check_register_limit(request: Request):
    """Verifica limite de registros"""
    await limiter.limit(settings.RATE_LIMIT_REGISTER)(request)