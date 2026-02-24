from sqlalchemy import Column, Integer, String, Boolean, DateTime, Index, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from datetime import datetime
import re
from typing import Optional, List

# ========== SQLAlchemy Models ==========

class User(Base):
    """Modelo SQLAlchemy - tabela users"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # ✅ NOVO: Campo para verificação de email
    email_verified = Column(Boolean, default=False, nullable=False)
    
    # 2FA fields
    tfa_enabled = Column(Boolean, default=False, nullable=False)
    tfa_secret = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relacionamentos
    tfa_codes = relationship("TFABackupCode", back_populates="user", cascade="all, delete-orphan")
    tfa_attempts = relationship("TFAAttempt", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_users_email_active', 'email', 'is_active'),
        Index('idx_users_created', 'created_at'),
        Index('idx_users_email_verified', 'email_verified'),  # ✅ NOVO índice
    )
    
    def __repr__(self):
        return f"<User {self.email}>"

class TFABackupCode(Base):
    __tablename__ = "tfa_backup_codes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(10), nullable=False)
    used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="tfa_codes")

class TFAAttempt(Base):
    __tablename__ = "tfa_attempts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code_entered = Column(String(10), nullable=True)
    success = Column(Boolean, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="tfa_attempts")

# ========== Pydantic Schemas ==========

class UserBase(BaseModel):
    """Schema base"""
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=255)

class UserCreate(UserBase):
    """Schema para registro interno (já com hash)"""
    hashed_password: str

class UserResponse(UserBase):
    """Schema para resposta (NUNCA inclui senha)"""
    id: int
    is_active: bool
    is_superuser: bool
    tfa_enabled: bool
    email_verified: bool  # ✅ NOVO campo na resposta
    created_at: datetime
    last_login: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

class UserInDB(UserResponse):
    """Schema interno (inclui hash)"""
    hashed_password: str

class TokenPayload(BaseModel):
    """Payload do JWT"""
    sub: str
    exp: int
    type: str = "access"
    email: Optional[str] = None

# ========== Schemas para Registro ==========

class RegisterRequest(BaseModel):
    """Requisição de registro com todos os dados"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)
    
    @field_validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Senha deve conter pelo menos uma letra maiúscula')
        if not re.search(r'[a-z]', v):
            raise ValueError('Senha deve conter pelo menos uma letra minúscula')
        if not re.search(r'[0-9]', v):
            raise ValueError('Senha deve conter pelo menos um número')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Senha deve conter pelo menos um caractere especial')
        return v

class VerifyEmailRequest(BaseModel):
    """Requisição para verificar código de email"""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)

class ResendCodeRequest(BaseModel):
    """Requisição para reenviar código"""
    email: EmailStr

# ========== 2FA Schemas ==========

class TFAEnableRequest(BaseModel):
    """Requisição para ativar 2FA"""
    code: str = Field(..., min_length=6, max_length=6)
    method: str = "authenticator"

class TFAVerifyRequest(BaseModel):
    """Requisição para verificar código 2FA"""
    code: str = Field(..., min_length=6, max_length=6)

class TFASetupResponse(BaseModel):
    """Resposta para configuração de 2FA"""
    secret: str
    qr_code: str
    backup_codes: List[str]

class TFALoginResponse(BaseModel):
    """Resposta após primeira etapa do login"""
    tfa_required: bool
    tfa_token: Optional[str] = None
    message: str
    user: Optional[UserResponse] = None

class TFACompleteLoginRequest(BaseModel):
    """Requisição para completar login 2FA"""
    tfa_token: str
    code: str = Field(..., min_length=6, max_length=6)