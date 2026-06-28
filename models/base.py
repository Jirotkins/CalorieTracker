from sqlalchemy.orm import DeclarativeBase

# Rodičovská třída pro modely (SQLAlchemy a Alembic je uvidí pohromadě)
class Base(DeclarativeBase):
    pass