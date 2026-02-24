from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from sqlalchemy.exc import IntegrityError
from models.user import User
from auth.utils import get_password_hash, verify_password
from datetime import datetime
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class UserRepository:
    """
    Repositório para operações com usuários no MySQL.
    Todas as operações de banco passam por aqui.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_user(self, email: str, password: str, full_name: Optional[str] = None) -> User:
        """
        Cria um novo usuário.
        A senha é automaticamente criptografada com bcrypt.
        """
        try:
            # CRIPTOGRAFA a senha antes de salvar
            hashed_password = get_password_hash(password)
            
            user = User(
                email=email.lower().strip(),
                hashed_password=hashed_password,  # ✅ CORRETO: hashed_password
                full_name=full_name.strip() if full_name else None
            )
            
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
            
            logger.info(f"✅ Usuário criado: {email} (ID: {user.id})")
            return user
            
        except IntegrityError as e:
            await self.db.rollback()
            if "Duplicate entry" in str(e):
                raise ValueError("Email já cadastrado")
            logger.error(f"Erro ao criar usuário: {e}")
            raise e
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Busca usuário por email"""
        result = await self.db.execute(
            select(User).where(
                and_(
                    User.email == email.lower().strip(),
                    User.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Busca usuário por ID"""
        result = await self.db.execute(
            select(User).where(
                and_(
                    User.id == user_id,
                    User.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Autentica usuário.
        Compara a senha fornecida com o hash armazenado.
        """
        user = await self.get_user_by_email(email)
        
        if not user:
            logger.warning(f"Tentativa de login com email inexistente: {email}")
            return None
        
        # VERIFICA se a senha corresponde ao HASH
        if not verify_password(password, user.hashed_password):  # ✅ CORRETO: hashed_password
            logger.warning(f"Senha incorreta para: {email}")
            return None
        
        # Atualiza último login
        user.last_login = datetime.now()
        await self.db.commit()
        
        logger.info(f"✅ Login bem-sucedido: {email}")
        return user
    
    async def update_user(self, user_id: int, data: Dict[str, Any]) -> Optional[User]:
        """Atualiza dados do usuário"""
        if "password" in data:
            # CRIPTOGRAFA nova senha
            hashed = get_password_hash(data["password"])
            data["hashed_password"] = hashed
            del data["password"]
        
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(**data, updated_at=datetime.now())
        )
        await self.db.commit()
        
        return await self.get_user_by_id(user_id)
    
    async def deactivate_user(self, user_id: int) -> bool:
        """Desativa usuário (soft delete)"""
        result = await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_active=False, updated_at=datetime.now())
        )
        await self.db.commit()
        return result.rowcount > 0