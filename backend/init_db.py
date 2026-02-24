import asyncio
import logging
import sys
from pathlib import Path

# Adiciona o diretório atual ao path do Python
sys.path.append(str(Path(__file__).parent))

from database import engine, create_tables
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_database():
    """Inicializa o banco de dados MySQL"""
    try:
        # Testa conexão
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            logger.info("✅ Conexão com MySQL estabelecida")
        
        # Cria tabelas
        await create_tables()
        logger.info("✅ Tabelas criadas/verificadas")
        
        # Mostra informações
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT DATABASE()"))
            db_name = result.scalar()
            logger.info(f"📊 Banco de dados: {db_name}")
            
            result = await conn.execute(text("SELECT VERSION()"))
            version = result.scalar()
            logger.info(f"🐬 MySQL Version: {version}")
        
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar banco: {e}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_database())