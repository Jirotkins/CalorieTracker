import os
from dotenv import load_dotenv

# Načte .env do workspacu
load_dotenv()

# Zkusí si vzít DATABASE_URL z .env souboru
# Pokud ho tam nenajde, použije sqlite:///./tracker.db
class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./tracker.db")

# Instance pro import v projektu
settings = Settings()