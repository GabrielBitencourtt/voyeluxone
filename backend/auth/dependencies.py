# auth/dependencies.py
from fastapi import Request, HTTPException, status, Depends
from typing import Optional
from auth.utils import decode_token
from config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from repositories.user_repository import UserRepository
from csrf import csrf_protect

settings = get_settings()

async def get_current_user_from_cookie(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[dict]:
    token = request.cookies.get(settings.COOKIE_NAME)
    
    if not token:
        return None
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    repo = UserRepository(db)
    user = await repo.get_user_by_id(int(user_id))
    
    if not user or not user.is_active:
        return None
    
    return user

async def get_current_active_user(
    current_user = Depends(get_current_user_from_cookie)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não autenticado",
            headers={"WWW-Authenticate": "Cookie"},
        )
    return current_user

def set_auth_cookie(response, access_token: str):
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=settings.COOKIE_HTTPONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path=settings.COOKIE_PATH,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

async def validate_csrf(
    request: Request,
    csrf_protect_instance = Depends(lambda: csrf_protect)
):
    """
    Valida o token CSRF para métodos não seguros.
    Usa lambda para evitar problema de callable.
    """
    await csrf_protect_instance.validate_csrf(request)
    return True