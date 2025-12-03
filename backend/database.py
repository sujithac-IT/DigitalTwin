import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_URI")
if not DATABASE_URL:
    # Optional fallback to local SQLite for dev if env missing
    DATABASE_URL = "sqlite:///./local.db"
else:
    # Ensure SSL is required for Supabase Postgres connections
    if DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://"):
        # Replace postgres:// with postgresql:// for SQLAlchemy 2.x compatibility
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
        # Add SSL mode if not present
        if "sslmode=" not in DATABASE_URL:
            sep = "&" if "?" in DATABASE_URL else "?"
            DATABASE_URL = f"{DATABASE_URL}{sep}sslmode=require"


class Base(DeclarativeBase):
    pass


# Connection pool settings optimized for serverless/Render
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5,  # Smaller pool for serverless
    max_overflow=10,  # Max additional connections
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args={
        "connect_timeout": 10,  # 10 second connection timeout
        "options": "-c statement_timeout=30000",  # 30 second query timeout
    } if DATABASE_URL.startswith("postgresql://") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
