import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.endpoints import user, food, meal_log, auth, recipe, upload
from api.deps import get_current_user

# Inicializace hlavní webové aplikace
app = FastAPI(
    title="CalorieTracker API",
    description="API pro sledování kalorií",
    version="1.0.0"
)

# CORS pro komunikaci s frontendem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, tags=["Authentication"])
app.include_router(food.router, prefix="/foods", tags=["Foods"], dependencies=[Depends(get_current_user)])
app.include_router(meal_log.router, prefix="/logs", tags=["Meal Logs"], dependencies=[Depends(get_current_user)])
app.include_router(recipe.router, prefix="/recipes", tags=["Recipes"])
app.include_router(upload.router, tags=["Upload"])

# Poskytování nahraných fotek
os.makedirs("/app/static/photos", exist_ok=True)
app.mount("/static", StaticFiles(directory="/app/static"), name="static")

# Hlavní uvítací stránka
@app.get("/")
def read_root():
    return {"message": "Vítejte v CalorieTracker API! Připojte se na /docs pro dokumentaci."}
