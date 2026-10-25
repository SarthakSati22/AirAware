"""
AirAware Configuration Settings
Loads environment variables and sets sensible defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env if present
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

class Settings:
    APP_NAME: str = "AirAware API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # MongoDB Atlas Connection
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "airaware_db")

    # ML Model directory
    MODEL_DIR: str = str(BASE_DIR / "backend" / "app" / "ml" / "artifacts")

    # Data paths
    SAMPLE_DATA_CSV: str = str(BASE_DIR / "data" / "sample" / "indian_cities_aqi.csv")
    CITIES_JSON: str = str(BASE_DIR / "data" / "sample" / "cities.json")
    STATIONS_JSON: str = str(BASE_DIR / "data" / "sample" / "monitoring_stations.json")

    # CORS origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
