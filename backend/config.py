from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    # JWT Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENVIRONMENT: str = "development"
    
    # Cookie Settings
    COOKIE_NAME: str = "auth_token"
    COOKIE_SECURE: bool = False
    COOKIE_HTTPONLY: bool = True
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: Optional[str] = None
    COOKIE_PATH: str = "/"
    
    # CSRF Settings
    CSRF_TOKEN_NAME: str = "csrf_token"
    CSRF_COOKIE_NAME: str = "csrf_token"
    CSRF_COOKIE_SECURE: bool = False  # Será True em produção
    CSRF_COOKIE_HTTPONLY: bool = False  # JavaScript precisa ler o token
    CSRF_COOKIE_SAMESITE: str = "lax"
    CSRF_HEADER_NAME: str = "X-CSRFToken"

    # Resend Settings
    RESEND_API_KEY: str
    RESEND_FROM_EMAIL: str = "noreply@voyeluxone.com"
    RESEND_FROM_NAME: str = "VoyeluxOne"
    
    # 2FA Settings
    TFA_TOKEN_EXPIRE_MINUTES: int = 10  # Código expira em 10 minutos
    TFA_ISSUER_NAME: str = "VoyeluxOne"  # Nome do emissor para autenticadores

    
    
    # MySQL Settings
    MYSQL_USER: str
    MYSQL_PASSWORD: str
    MYSQL_HOST: str
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str
    MYSQL_POOL_SIZE: int = 10
    MYSQL_POOL_RECYCLE: int = 3600
    MYSQL_ECHO: bool = False

        # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None
    
    # Rate Limiting
    RATE_LIMIT_LOGIN: str = "5/minute"  # 5 tentativas por minuto
    RATE_LIMIT_TFA: str = "3/minute"     # 3 tentativas de código por minuto
    RATE_LIMIT_REGISTER: str = "2/hour"  # 2 registros por hora por IP
    
    @property
    def REDIS_CONNECTION_URL(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    @property
    def DATABASE_URL(self) -> str:
        # Para desenvolvimento, use URL sem SSL
        if self.ENVIRONMENT == "development":
            return f"mysql+aiomysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
        else:
            # Produção com SSL
            return f"mysql+aiomysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}?ssl_ca=/etc/ssl/certs/ca-certificates.crt"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache
def get_settings():
    return Settings()