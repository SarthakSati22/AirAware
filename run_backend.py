"""
Convenient Runner Script for AirAware Backend
Allows starting the server directly from the root project directory:
    python run_backend.py
"""

import sys
import os
from pathlib import Path

# Add backend directory to sys.path
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    print(f"Starting {settings.APP_NAME} on http://localhost:{settings.PORT}")
    print("Swagger API documentation available at: http://localhost:8000/docs")
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True, app_dir=str(backend_dir))
