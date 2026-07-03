from sqlalchemy import select
from sqlalchemy.orm import Session
from models.user import User
from core.security import get_password_hash

def get_user_by_username(session: Session, username: str) -> User | None:
    """Najde uživatele podle uživatelského jména (např. při loginu)."""
    query = select(User).where(User.username == username)
    return session.scalar(query)

def get_user(session: Session, user_id: int) -> User | None:
    """Najde uživatele podle jeho ID."""
    # session.get() je zkratka pro vyhledávání přímo přes Primary Key (id)
    return session.get(User, user_id)

def create_user(
    session: Session, 
    username: str, 
    password: str, 
    calories_goal: int = 2000, 
    fat_goal: float = 70.0,
    saturates_goal: float = 20.0,
    carbs_goal: float = 250.0,
    sugar_goal: float = 50.0,
    protein_goal: float = 120.0,
    salt_goal: float = 6.0
) -> User:
    """Vytvoří nového uživatele v databázi a vrátí jeho uložený objekt."""
    hashed_password = get_password_hash(password)
    new_user = User(
        username=username,
        password=hashed_password,
        daily_calories_goal=calories_goal,
        daily_fat_goal=fat_goal,
        daily_saturates_goal=saturates_goal,
        daily_carbs_goal=carbs_goal,
        daily_sugar_goal=sugar_goal,
        daily_protein_goal=protein_goal,
        daily_salt_goal=salt_goal
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return new_user

def update_user_goals(session: Session, user_id: int, **kwargs) -> User | None:
    """Upraví cíle uživatele. Předá jen to, co chce změnit."""
    user = get_user(session, user_id)
    if not user:
        return None
        
    # Projde všechny předané argumenty a nastaví je objektu
    for key, value in kwargs.items():
        setattr(user, key, value)
        
    session.commit()
    session.refresh(user)
    return user

def delete_user(session: Session, user_id: int) -> bool:
    """Smaže uživatele. (A díky cascade v modelech smaže i jeho jídla a deníček)."""
    user = get_user(session, user_id)
    if not user:
        return False
        
    session.delete(user)
    session.commit()
    return True
