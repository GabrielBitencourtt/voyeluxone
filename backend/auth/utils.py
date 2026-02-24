import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

# ⚠️ REMOVER: from passlib.context import CryptContext

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha fornecida corresponde ao hash armazenado.
    Usa bcrypt diretamente (mais seguro e sem warnings).
    """
    try:
        # Converte strings para bytes se necessário
        if isinstance(plain_password, str):
            plain_password = plain_password.encode('utf-8')
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        
        return bcrypt.checkpw(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Erro ao verificar senha: {e}")
        return False

def get_password_hash(password: str) -> str:
    """
    Gera um hash bcrypt da senha fornecida.
    Valida o tamanho máximo de 72 bytes por segurança.
    """
    # Validação de segurança: bcrypt tem limite de 72 bytes
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        raise ValueError(
            "Senha muito longa. O bcrypt suporta no máximo 72 bytes. "
            "Por favor, use uma senha mais curta."
        )
    
    # Gera salt com fator de custo 12 (recomendado)
    salt = bcrypt.gensalt(rounds=12)
    
    # Retorna o hash como string
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

# As funções de JWT permanecem iguais
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria JWT token de acesso"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Cria refresh token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """Decodifica e valida JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.JWTError as e:
        logger.error(f"Erro ao decodificar token: {e}")
        return None