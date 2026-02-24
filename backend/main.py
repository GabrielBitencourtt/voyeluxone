from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from auth.routes import router as auth_router
from config import get_settings
from database import engine, create_tables
from middleware.security import SecurityHeadersMiddleware
from csrf import csrf_protect  # ✅ Import correto
from services.redis import redis_service

settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Iniciando aplicação...")
    try:
        await create_tables()
        logger.info("✅ Banco de dados MySQL pronto")
        
        # Conecta ao Redis
        await redis_service.connect()
        logger.info("✅ Redis conectado")
        
    except Exception as e:
        logger.error(f"❌ Erro na inicialização: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Finalizando aplicação...")
    await engine.dispose()
    await redis_service.disconnect()
    logger.info("✅ Conexões fechadas")

app = FastAPI(
    title="Secure Login System",
    description="Sistema de login com MySQL, bcrypt, Redis e 2FA",
    version="2.0.0",
    lifespan=lifespan
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de segurança
app.add_middleware(SecurityHeadersMiddleware)

# ✅ NÃO precisa de csrf_protect.init_app(app) - remova esta linha

# Inclui rotas
app.include_router(auth_router)

@app.get("/")
async def root():
    return {
        "message": "Secure Login System API",
        "version": "2.0.0",
        "docs": "/docs",
        "database": "MySQL",
        "cache": "Redis",
        "security": "bcrypt + HttpOnly Cookies + CSRF Protection + 2FA"
    }

@app.get("/health")
async def health_check():
    # Verifica Redis
    redis_status = "connected" if redis_service._connected else "disconnected"
    
    # Verifica MySQL
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "connected"
    except:
        db_status = "disconnected"
    
    return {
        "status": "healthy" if db_status == "connected" and redis_status == "connected" else "unhealthy",
        "database": db_status,
        "redis": redis_status,
        "timestamp": datetime.utcnow().isoformat()
    }

from datetime import datetime