# backend/csrf.py
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel
from config import get_settings

settings = get_settings()

class CsrfSettings(BaseModel):
    """Configuração do CSRF Protection"""
    secret_key: str = settings.SECRET_KEY
    cookie_samesite: str = settings.CSRF_COOKIE_SAMESITE
    cookie_secure: bool = settings.CSRF_COOKIE_SECURE
    cookie_httponly: bool = settings.CSRF_COOKIE_HTTPONLY
    cookie_name: str = settings.CSRF_COOKIE_NAME
    header_name: str = settings.CSRF_HEADER_NAME
    token_location: str = "header"
    max_age: int = 3600  # 1 hora

@CsrfProtect.load_config
def get_csrf_config():
    """Carrega configuração do CSRF"""
    return CsrfSettings()

# Instância global do CSRF Protect
csrf_protect = CsrfProtect()