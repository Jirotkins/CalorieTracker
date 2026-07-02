from fastapi import FastAPI
from api.endpoints import user, food, meal_log

# Inicializace hlavní webové aplikace
app = FastAPI(
    title="CalorieTracker API",
    description="API pro sledování kalorií",
    version="1.0.0"
)

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(food.router, prefix="/foods", tags=["Foods"])
app.include_router(meal_log.router, prefix="/logs", tags=["Meal Logs"])

# Hlavní uvítací stránka
@app.get("/")
def read_root():
    return {"message": "Vítejte v CalorieTracker API! Připojte se na /docs pro dokumentaci."}
