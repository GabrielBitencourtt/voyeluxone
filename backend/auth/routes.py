# auth/routes.py
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import timedelta, datetime
from typing import Any, List, Optional
from pydantic import EmailStr
import secrets
import string
import re

from models.user import (
    User, UserCreate, UserResponse, TFAEnableRequest, 
    TFAVerifyRequest, TFASetupResponse, TFALoginResponse,
    TFACompleteLoginRequest, TFABackupCode, TFAAttempt,
    RegisterRequest, VerifyEmailRequest, ResendCodeRequest
)
from auth.utils import create_access_token, get_password_hash, verify_password
from auth.dependencies import set_auth_cookie, get_current_active_user, validate_csrf
from config import get_settings
from database import get_db
from repositories.user_repository import UserRepository
from csrf import csrf_protect
from services.email import EmailService
from services.tfa import TFAService
from services.redis import redis_service

router = APIRouter(prefix="/auth", tags=["authentication"])
settings = get_settings()
tfa_service = TFAService()
email_service = EmailService()

# ===== REGISTRO COM VERIFICAÇÃO DE EMAIL =====

@router.post("/register")
async def register(
    request: Request,
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Primeira etapa do registro: salva dados temporariamente e envia código
    """
    client_ip = request.client.host
    
    # Rate limiting
    register_key = f"register:attempt:{client_ip}"
    attempts = await redis_service.get(register_key)
    if attempts and int(attempts) >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Tente novamente em 1 hora."
        )
    
    # Verifica se email já existe e está confirmado
    repo = UserRepository(db)
    existing_user = await repo.get_user_by_email(user_data.email)
    
    if existing_user:
        if existing_user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado e verificado"
            )
        else:
            # Usuário já existe mas não verificou email
            # Atualiza os dados e reenvia código
            existing_user.full_name = user_data.full_name
            existing_user.hashed_password = get_password_hash(user_data.password)
            await db.commit()
            
            # Gera novo código
            code = email_service.generate_verification_code()
            
            # Salva no Redis
            await redis_service.set(
                f"register:pending:{user_data.email}",
                {
                    "user_id": existing_user.id,
                    "full_name": user_data.full_name,
                    "attempts": 0
                },
                expire=timedelta(minutes=15)
            )
            
            # Envia email
            await email_service.send_verification_code(
                user_data.email, 
                code, 
                user_data.full_name
            )
            
            # Incrementa contador
            await redis_service.increment(register_key)
            if not attempts:
                await redis_service.expire(register_key, 3600)
            
            return {
                "message": "Código de verificação enviado para seu email",
                "email": user_data.email,
                "existing": True
            }
    
    # Verifica se já existe um registro pendente para este email
    pending = await redis_service.get(f"register:pending:{user_data.email}")
    if pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um cadastro em andamento para este email. Verifique seu email ou solicite um novo código."
        )
    
    # Gera código de 6 dígitos
    code = email_service.generate_verification_code()
    
    # Hash da senha para armazenamento temporário
    hashed_password = get_password_hash(user_data.password)
    
    # Salva dados temporários no Redis
    await redis_service.set(
        f"register:pending:{user_data.email}",
        {
            "email": user_data.email,
            "hashed_password": hashed_password,
            "full_name": user_data.full_name,
            "attempts": 0
        },
        expire=timedelta(minutes=15)
    )
    
    # Salva o código separadamente para facilitar verificação
    await redis_service.set(
        f"register:code:{user_data.email}",
        code,
        expire=timedelta(minutes=15)
    )
    
    # Incrementa contador de tentativas
    await redis_service.increment(register_key)
    if not attempts:
        await redis_service.expire(register_key, 3600)
    
    # Envia email
    await email_service.send_verification_code(
        user_data.email, 
        code, 
        user_data.full_name
    )
    
    return {
        "message": "Código de verificação enviado para seu email",
        "email": user_data.email
    }

@router.post("/register/verify")
async def verify_email(
    request: Request,
    verify_data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
    # _: bool = Depends(validate_csrf)
):
    """
    Segunda etapa: verifica código e cria usuário definitivamente
    """
    client_ip = request.client.host
    
    # Rate limiting
    verify_key = f"register:verify:{client_ip}"
    attempts = await redis_service.get(verify_key)
    if attempts and int(attempts) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Tente novamente em 1 hora."
        )
    
    # Busca código no Redis
    stored_code = await redis_service.get(f"register:code:{verify_data.email}")
    if not stored_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código expirado ou não solicitado. Solicite um novo código."
        )
    
    # Verifica código
    if stored_code != verify_data.code:
        # Incrementa contador de tentativas
        await redis_service.increment(verify_key)
        if not attempts:
            await redis_service.expire(verify_key, 3600)
        
        # Incrementa tentativas no registro pendente
        pending = await redis_service.get(f"register:pending:{verify_data.email}")
        if pending:
            pending["attempts"] = pending.get("attempts", 0) + 1
            await redis_service.set(
                f"register:pending:{verify_data.email}",
                pending,
                expire=timedelta(minutes=15)
            )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido"
        )
    
    # Código válido - busca dados pendentes
    pending = await redis_service.get(f"register:pending:{verify_data.email}")
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dados de registro não encontrados. Inicie o cadastro novamente."
        )
    
    # Verifica se usuário já existe
    repo = UserRepository(db)
    existing_user = await repo.get_user_by_email(verify_data.email)
    
    if existing_user:
        # Atualiza usuário existente
        existing_user.email_verified = True
        if pending.get("full_name"):
            existing_user.full_name = pending["full_name"]
        await db.commit()
        user = existing_user
    else:
        # Cria novo usuário
        user = User(
            email=verify_data.email.lower().strip(),
            hashed_password=pending["hashed_password"],
            full_name=pending.get("full_name"),
            email_verified=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # Remove dados temporários do Redis
    await redis_service.delete(f"register:code:{verify_data.email}")
    await redis_service.delete(f"register:pending:{verify_data.email}")
    
    # Faz login automático
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    response = Response()
    set_auth_cookie(response, access_token)
    
    # Gera CSRF
    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    csrf_protect.set_csrf_cookie(signed_token, response)
    
    return {
        "message": "Email verificado e cadastro concluído com sucesso",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@router.post("/register/resend")
async def resend_code(
    request: Request,
    resend_data: ResendCodeRequest,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(validate_csrf)
):
    """
    Reenvia código de verificação
    """
    client_ip = request.client.host
    
    # Rate limiting
    resend_key = f"register:resend:{client_ip}"
    resend_count = await redis_service.get(resend_key)
    if resend_count and int(resend_count) >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitos pedidos de reenvio. Tente novamente em 1 hora."
        )
    
    # Verifica se existe registro pendente
    pending = await redis_service.get(f"register:pending:{resend_data.email}")
    if not pending:
        # Verifica se é um usuário não verificado
        repo = UserRepository(db)
        user = await repo.get_user_by_email(resend_data.email)
        if user and not user.email_verified:
            # Cria registro pendente para usuário existente
            pending = {
                "user_id": user.id,
                "full_name": user.full_name,
                "attempts": 0
            }
            await redis_service.set(
                f"register:pending:{resend_data.email}",
                pending,
                expire=timedelta(minutes=15)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhum registro em andamento para este email"
            )
    
    # Gera novo código
    code = email_service.generate_verification_code()
    
    # Salva novo código
    await redis_service.set(
        f"register:code:{resend_data.email}",
        code,
        expire=timedelta(minutes=15)
    )
    
    # Incrementa contador
    await redis_service.increment(resend_key)
    if not resend_count:
        await redis_service.expire(resend_key, 3600)
    
    # Envia email
    await email_service.send_verification_code(
        resend_data.email,
        code,
        pending.get("full_name")
    )
    
    return {"message": "Novo código enviado com sucesso"}

@router.get("/register/status/{email}")
async def check_registration_status(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Verifica status do registro para um email
    """
    # Verifica se existe registro pendente
    pending = await redis_service.get(f"register:pending:{email}")
    
    # Verifica se usuário já existe
    repo = UserRepository(db)
    user = await repo.get_user_by_email(email)
    
    if user:
        if user.email_verified:
            return {
                "status": "completed",
                "message": "Email já verificado e cadastro concluído"
            }
        else:
            return {
                "status": "pending",
                "message": "Email já cadastrado mas não verificado",
                "can_resend": True
            }
    elif pending:
        return {
            "status": "pending",
            "message": "Registro em andamento",
            "can_resend": True
        }
    else:
        return {
            "status": "not_found",
            "message": "Nenhum registro encontrado para este email"
        }

# ===== LOGIN COM VERIFICAÇÃO DE EMAIL =====

@router.post("/login")
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Login com verificação de email
    """
    client_ip = request.client.host
    
    # Rate limiting
    attempts = await redis_service.get(f"login:attempts:{client_ip}")
    if attempts and int(attempts) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas de login. Tente novamente em 15 minutos."
        )
    
    repo = UserRepository(db)
    user = await repo.get_user_by_email(form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Incrementa contador
        current = await redis_service.increment(f"login:attempts:{client_ip}")
        if current == 1:
            await redis_service.expire(f"login:attempts:{client_ip}", 900)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verifica se email foi verificado
    if not user.email_verified:
        # Gera novo código se necessário
        pending = await redis_service.get(f"register:pending:{user.email}")
        if not pending:
            code = email_service.generate_verification_code()
            await redis_service.set(
                f"register:code:{user.email}",
                code,
                expire=timedelta(minutes=15)
            )
            await redis_service.set(
                f"register:pending:{user.email}",
                {"user_id": user.id, "full_name": user.full_name},
                expire=timedelta(minutes=15)
            )
            await email_service.send_verification_code(
                user.email,
                code,
                user.full_name
            )
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email não verificado. Um novo código foi enviado para seu email."
        )
    
    # Reset contador
    await redis_service.delete(f"login:attempts:{client_ip}")
    
    # Verifica 2FA
    if user.tfa_enabled:
        if await redis_service.exists(f"tfa:block:{user.id}"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas tentativas de 2FA. Tente novamente em 30 minutos."
            )
        
        tfa_token = tfa_service.create_tfa_token(user.id, user.email)
        code = tfa_service.generate_email_code()
        
        await redis_service.set(
            f"tfa:code:{user.id}",
            code,
            expire=timedelta(minutes=settings.TFA_TOKEN_EXPIRE_MINUTES)
        )
        
        await email_service.send_tfa_code(user.email, code, user.full_name)
        
        return TFALoginResponse(
            tfa_required=True,
            tfa_token=tfa_token,
            message="Código de verificação 2FA enviado para seu email"
        )
    
    # Login normal
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    set_auth_cookie(response, access_token)
    
    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    csrf_protect.set_csrf_cookie(signed_token, response)
    
    user.last_login = datetime.utcnow()
    await db.commit()
    
    return TFALoginResponse(
        tfa_required=False,
        message="Login realizado com sucesso",
        user=user
    )

# ===== 2FA SETUP =====

@router.post("/tfa/setup", response_model=TFASetupResponse)
async def setup_tfa(
    request: Request,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(validate_csrf)
):
    """Inicia configuração do 2FA"""
    if current_user.tfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA já está ativo para este usuário"
        )
    
    if not current_user.tfa_secret:
        secret = tfa_service.generate_secret()
        current_user.tfa_secret = secret
        await db.commit()
    
    qr_uri = tfa_service.generate_qr_uri(current_user.tfa_secret, current_user.email)
    backup_codes = tfa_service.generate_backup_codes(8)
    
    for code in backup_codes:
        backup_code = TFABackupCode(
            user_id=current_user.id,
            code=code,
            used=False
        )
        db.add(backup_code)
    await db.commit()
    
    return TFASetupResponse(
        secret=current_user.tfa_secret,
        qr_code=qr_uri,
        backup_codes=backup_codes
    )

@router.post("/tfa/enable")
async def enable_tfa(
    request: Request,
    tfa_data: TFAEnableRequest,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(validate_csrf)
):
    """Ativa 2FA após verificar primeiro código"""
    if current_user.tfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA já está ativo"
        )
    
    if not current_user.tfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure o 2FA primeiro (/tfa/setup)"
        )
    
    valid = False
    if tfa_data.method == "authenticator":
        valid = tfa_service.verify_totp(current_user.tfa_secret, tfa_data.code)
    else:
        stored_code = await redis_service.get(f"tfa:setup:{current_user.id}")
        valid = stored_code == tfa_data.code
    
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido"
        )
    
    current_user.tfa_enabled = True
    await db.commit()
    await redis_service.delete(f"tfa:setup:{current_user.id}")
    
    return {"message": "2FA ativado com sucesso"}

@router.post("/tfa/disable")
async def disable_tfa(
    request: Request,
    password: str,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(validate_csrf)
):
    """Desativa 2FA (requer senha)"""
    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha incorreta"
        )
    
    current_user.tfa_enabled = False
    await db.commit()
    
    return {"message": "2FA desativado com sucesso"}

# ===== LOGIN COMPLETE =====

@router.post("/login/complete")
async def complete_tfa_login(
    request: Request,
    response: Response,
    tfa_data: TFACompleteLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Segunda etapa do login 2FA"""
    client_ip = request.client.host
    
    payload = tfa_service.verify_tfa_token(tfa_data.tfa_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado"
        )
    
    user_id = int(payload.get("sub"))
    
    if await redis_service.exists(f"tfa:block:{user_id}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Tente novamente em 30 minutos."
        )
    
    stored_code = await redis_service.get(f"tfa:code:{user_id}")
    if not stored_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código expirado. Solicite um novo."
        )
    
    attempts_key = f"tfa:attempts:{user_id}"
    attempts = await redis_service.increment(attempts_key)
    if attempts == 1:
        await redis_service.expire(attempts_key, 3600)
    
    if stored_code != tfa_data.code:
        if attempts >= 5:
            await redis_service.set(
                f"tfa:block:{user_id}",
                "blocked",
                expire=timedelta(minutes=30)
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas tentativas. Bloqueado por 30 minutos."
            )
        
        attempt = TFAAttempt(
            user_id=user_id,
            code_entered=tfa_data.code,
            success=False,
            ip_address=client_ip
        )
        db.add(attempt)
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Código inválido. Tentativas restantes: {5 - attempts}"
        )
    
    await redis_service.delete(f"tfa:code:{user_id}")
    await redis_service.delete(attempts_key)
    
    repo = UserRepository(db)
    user = await repo.get_user_by_id(user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado"
        )
    
    attempt = TFAAttempt(
        user_id=user_id,
        code_entered=tfa_data.code,
        success=True,
        ip_address=client_ip
    )
    db.add(attempt)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    set_auth_cookie(response, access_token)
    
    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    csrf_protect.set_csrf_cookie(signed_token, response)
    
    user.last_login = datetime.utcnow()
    await db.commit()
    
    return {
        "message": "Login 2FA concluído com sucesso",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

# ===== LOGOUT =====

@router.post("/logout")
async def logout(
    response: Response,
    current_user = Depends(get_current_active_user),
    _: bool = Depends(validate_csrf)
):
    """Remove os cookies de autenticação e CSRF"""
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path=settings.COOKIE_PATH,
        domain=settings.COOKIE_DOMAIN
    )
    
    response.delete_cookie(
        key=settings.CSRF_COOKIE_NAME,
        path=settings.COOKIE_PATH,
        domain=settings.COOKIE_DOMAIN
    )
    
    return {"message": "Logout realizado com sucesso"}

# ===== ME =====

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_active_user)
):
    """Retorna informações do usuário atual"""
    return current_user