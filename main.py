from fastapi import FastAPI, Depends
from api.endpoints import user, food, meal_log, auth
from api.deps import get_current_user

# Inicializace hlavní webové aplikace
app = FastAPI(
    title="CalorieTracker API",
    description="API pro sledování kalorií",
    version="1.0.0"
)

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, tags=["Authentication"])
app.include_router(food.router, prefix="/foods", tags=["Foods"], dependencies=[Depends(get_current_user)])
app.include_router(meal_log.router, prefix="/logs", tags=["Meal Logs"], dependencies=[Depends(get_current_user)])

# Hlavní uvítací stránka
@app.get("/")
def read_root():
    return {"message": "Vítejte v CalorieTracker API! Připojte se na /docs pro dokumentaci."}
