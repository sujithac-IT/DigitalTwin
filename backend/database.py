import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("SUPABASE_URI")

if not DATABASE_URL:
    # Optional fallback to local SQLite for dev if env missing
    DATABASE_URL = "sqlite:///./local.db"
    logger.info("No SUPABASE_URI found, using local SQLite database")
else:
    # Ensure SSL is required for Supabase Postgres connections
    if DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://"):
        # Replace postgres:// with postgresql:// for SQLAlchemy 2.x compatibility
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
        # For Supabase free tier: Use Connection Pooler (IPv4) instead of Direct Connection (IPv6)
        # Connection Pooler uses port 6543 and pooler.supabase.com
        # This is necessary because Render/most cloud providers don't support IPv6
        
        # Validate connection type and log appropriate message
        if "pooler.supabase.com" in DATABASE_URL and ":6543" in DATABASE_URL:
            logger.info("✅ Using Supabase Connection Pooler (IPv4) - Render compatible!")
        elif "db." in DATABASE_URL and ":5432" in DATABASE_URL:
            logger.error(
                "❌ Using Direct Connection (IPv6) - This WILL FAIL on Render! "
                "You must use Supabase Connection Pooler (port 6543) for IPv4 support. "
                "Get it from: Supabase Dashboard → Database → Connection String → 'Transaction' mode"
            )
        
        # Add connection parameters for Supabase
        if "?" in DATABASE_URL:
            if "sslmode=" not in DATABASE_URL:
                DATABASE_URL += "&sslmode=require"
            if "connect_timeout=" not in DATABASE_URL:
                DATABASE_URL += "&connect_timeout=10"
        else:
            DATABASE_URL += "?sslmode=require&connect_timeout=10"


class Base(DeclarativeBase):
    pass


# Connection pool settings optimized for serverless/Render
# Use NullPool for serverless to prevent connection pool exhaustion
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # No connection pooling - each request gets new connection (best for serverless)
    echo=False,  # Set to True for SQL query debugging
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    } if DATABASE_URL.startswith("postgresql://") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
