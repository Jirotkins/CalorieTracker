from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core.database import get_db
import crud.user
from core.security import verify_password, create_access_token

router = APIRouter()

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Zkusí najít uživatele v databázi podle jména
    user = crud.user.get_user_by_username(db, username=form_data.username)
    
    # Pokud uživatel neexistuje/pokud nesouhlasí heslo s hashem -> chyba 401
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nesprávné jméno nebo heslo",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Vygenerování podepsaného JWT tokenu
    # "sub" (Subject) - nositel tokenu
    access_token = create_access_token(data={"sub": user.username})
    
    # Vrací token mobilu
    return {"access_token": access_token, "token_type": "bearer"}
