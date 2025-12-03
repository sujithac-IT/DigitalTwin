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
        if "sslmode=" not in DATABASE_URL:
            sep = "&" if "?" in DATABASE_URL else "?"
            DATABASE_URL = f"{DATABASE_URL}{sep}sslmode=require"


class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
