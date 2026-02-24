import pyotp
import secrets
import string
from datetime import datetime, timedelta
from typing import Tuple, List, Optional, Dict
from jose import jwt, JWTError
from config import get_settings
from services.redis import redis_service
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class TFAService:
    """Serviço de Two-Factor Authentication com Redis"""
    
    # Prefixos para chaves Redis
    CODE_PREFIX = "tfa:code:"
    ATTEMPTS_PREFIX = "tfa:attempts:"
    BLOCK_PREFIX = "tfa:block:"
    SESSION_PREFIX = "tfa:session:"
    
    @staticmethod
    def generate_secret() -> str:
        """Gera um segredo TOTP para o usuário"""
        return pyotp.random_base32()
    
    @staticmethod
    def generate_qr_uri(secret: str, email: str) -> str:
        """Gera URI para QR code (para Google Authenticator etc)"""
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=email,
            issuer_name=settings.TFA_ISSUER_NAME
        )
    
    @staticmethod
    def generate_backup_codes(count: int = 8) -> List[str]:
        """Gera códigos de backup (8 dígitos cada)"""
        codes = []
        for _ in range(count):
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            codes.append(code)
        return codes
    
    @staticmethod
    def verify_totp(secret: str, code: str) -> bool:
        """Verifica código TOTP (para Google Authenticator)"""
        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(code)
        except Exception as e:
            logger.error(f"Erro ao verificar TOTP: {e}")
            return False
    
    @staticmethod
    def generate_email_code() -> str:
        """Gera código numérico de 6 dígitos para email"""
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    @staticmethod
    def create_tfa_token(user_id: int, email: str) -> str:
        """Cria token temporário para segunda etapa do 2FA"""
        expire = datetime.utcnow() + timedelta(minutes=settings.TFA_TOKEN_EXPIRE_MINUTES)
        to_encode = {
            "sub": str(user_id),
            "email": email,
            "type": "tfa_temp",
            "exp": expire
        }
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    @staticmethod
    def verify_tfa_token(token: str) -> Optional[dict]:
        """Verifica token temporário do 2FA"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "tfa_temp":
                return None
            return payload
        except JWTError as e:
            logger.error(f"Erro ao verificar token TFA: {e}")
            return None
    
    async def store_tfa_code(self, user_id: int, code: str) -> bool:
        """
        Armazena código 2FA no Redis com expiração
        """
        key = f"{self.CODE_PREFIX}{user_id}"
        return await redis_service.set(
            key, 
            code, 
            expire=timedelta(minutes=settings.TFA_TOKEN_EXPIRE_MINUTES)
        )
    
    async def get_tfa_code(self, user_id: int) -> Optional[str]:
        """
        Recupera código 2FA do Redis
        """
        key = f"{self.CODE_PREFIX}{user_id}"
        return await redis_service.get(key)
    
    async def delete_tfa_code(self, user_id: int) -> bool:
        """
        Remove código 2FA após uso
        """
        key = f"{self.CODE_PREFIX}{user_id}"
        return await redis_service.delete(key)
    
    async def record_attempt(self, user_id: int, success: bool, ip: str) -> int:
        """
        Registra tentativa de 2FA e retorna número de tentativas
        """
        key = f"{self.ATTEMPTS_PREFIX}{user_id}"
        
        # Incrementa contador
        attempts = await redis_service.increment(key)
        
        # Define expiração de 1 hora se for nova chave
        if attempts == 1:
            await redis_service.expire(key, 3600)  # 1 hora
        
        # Se muitas tentativas, bloqueia
        if attempts >= 5:
            await self.block_user(user_id, 30)  # Bloqueia por 30 minutos
        
        return attempts
    
    async def block_user(self, user_id: int, minutes: int) -> bool:
        """
        Bloqueia usuário após muitas tentativas
        """
        key = f"{self.BLOCK_PREFIX}{user_id}"
        return await redis_service.set(
            key,
            "blocked",
            expire=timedelta(minutes=minutes)
        )
    
    async def is_blocked(self, user_id: int) -> bool:
        """
        Verifica se usuário está bloqueado
        """
        key = f"{self.BLOCK_PREFIX}{user_id}"
        return await redis_service.exists(key)
    
    async def create_session(self, user_id: int, data: Dict) -> str:
        """
        Cria sessão temporária no Redis
        """
        session_id = secrets.token_urlsafe(32)
        key = f"{self.SESSION_PREFIX}{session_id}"
        
        session_data = {
            "user_id": user_id,
            "data": data,
            "created_at": datetime.utcnow().isoformat()
        }
        
        await redis_service.set(
            key,
            session_data,
            expire=timedelta(minutes=30)
        )
        
        return session_id
    
    async def get_session(self, session_id: str) -> Optional[Dict]:
        """
        Recupera sessão do Redis
        """
        key = f"{self.SESSION_PREFIX}{session_id}"
        return await redis_service.get(key)
    
    async def delete_session(self, session_id: str) -> bool:
        """
        Remove sessão
        """
        key = f"{self.SESSION_PREFIX}{session_id}"
        return await redis_service.delete(key)

# Instância global
tfa_service = TFAService()