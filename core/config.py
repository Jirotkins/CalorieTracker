import os
from dotenv import load_dotenv

# Načte .env do workspacu
load_dotenv()

# Zkusí si vzít DATABASE_URL z .env souboru
# Pokud ho tam nenajde, použije sqlite:///./tracker.db
class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./tracker.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback_tajny_klic")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1008000"))

# Instance pro import v projektu
settings = Settings()