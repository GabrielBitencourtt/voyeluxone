from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, declared_attr
from sqlalchemy import MetaData
from config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

# Naming convention para constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)

# Engine assíncrona
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.MYSQL_ECHO,
    pool_size=settings.MYSQL_POOL_SIZE,
    max_overflow=20,
    pool_recycle=settings.MYSQL_POOL_RECYCLE,
    pool_pre_ping=True,
)

# Fábrica de sessões
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base para modelos - CORRIGIDO: não use metadata aqui ainda
Base = declarative_base()

# Função para obter metadados com naming convention
def get_metadata():
    """Retorna metadata com naming convention"""
    return metadata

# Dependência para obter sessão do banco
async def get_db() -> AsyncSession:
    """Dependência do FastAPI para obter sessão do banco"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Função para criar tabelas
async def create_tables():
    """Cria todas as tabelas no MySQL"""
    # Importa os modelos aqui para evitar importação circular
    from models.user import User
    
    async with engine.begin() as conn:
        # Cria as tabelas apenas para os modelos que herdam de Base
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Tabelas criadas/verificadas com sucesso")