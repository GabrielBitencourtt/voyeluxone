import redis.asyncio as redis
from typing import Optional, Any
import json
from datetime import timedelta
from config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class RedisService:
    """Serviço de cache com Redis"""
    
    def __init__(self):
        self.client = None
        self._connected = False
    
    async def connect(self):
        """Conecta ao Redis"""
        try:
            self.client = await redis.from_url(
                settings.REDIS_CONNECTION_URL,
                decode_responses=True
            )
            await self.client.ping()
            self._connected = True
            logger.info("✅ Conectado ao Redis")
        except Exception as e:
            logger.error(f"❌ Erro ao conectar ao Redis: {e}")
            self._connected = False
    
    async def disconnect(self):
        """Desconecta do Redis"""
        if self.client:
            await self.client.close()
            self._connected = False
            logger.info("✅ Desconectado do Redis")
    
    async def set(self, key: str, value: Any, expire: Optional[timedelta] = None):
        """Armazena valor no Redis"""
        if not self._connected:
            return False
        
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            if expire:
                await self.client.setex(key, int(expire.total_seconds()), value)
            else:
                await self.client.set(key, value)
            return True
        except Exception as e:
            logger.error(f"Erro ao setar {key}: {e}")
            return False
    
    async def get(self, key: str) -> Optional[Any]:
        """Recupera valor do Redis"""
        if not self._connected:
            return None
        
        try:
            value = await self.client.get(key)
            if value and value.startswith(('{', '[')):
                try:
                    return json.loads(value)
                except:
                    pass
            return value
        except Exception as e:
            logger.error(f"Erro ao get {key}: {e}")
            return None
    
    async def delete(self, key: str) -> bool:
        """Remove chave do Redis"""
        if not self._connected:
            return False
        
        try:
            await self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Verifica se chave existe"""
        if not self._connected:
            return False
        
        try:
            return await self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Erro ao verificar {key}: {e}")
            return False
    
    async def increment(self, key: str) -> int:
        """Incrementa contador"""
        if not self._connected:
            return 0
        
        try:
            return await self.client.incr(key)
        except Exception as e:
            logger.error(f"Erro ao incrementar {key}: {e}")
            return 0
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Define expiração"""
        if not self._connected:
            return False
        
        try:
            return await self.client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Erro ao setar expire {key}: {e}")
            return False

# Instância global
redis_service = RedisService()