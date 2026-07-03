from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.config import settings

# Nejnižší vrstva SQLAlchemy, která udržuje fyzické spojení s databází
engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)

# Databázové "relace" (Sessions)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Generátor databázových spojení
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
