"""
Main Application Entrypoint for AirAware FastAPI Backend
Smart Air Quality Monitoring and Big Data Analytics Platform.
"""

import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import get_database
from app.routes.air_quality import router as air_quality_router
from app.routes.forecasts import router as forecasts_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and ensure collections & indexes
    get_database()
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## AirAware — Smart Air Quality Monitoring & Big Data Analytics Platform
    Aligned with United Nations Sustainable Development Goals:
    - **SDG 3:** Good Health and Well-being
    - **SDG 11:** Sustainable Cities and Communities
    
    Provides high-throughput analytics, CPCB NAQI calculation, Leaflet geospatial mapping,
    recursive Random Forest ML forecasting, and reproducible big data pipelines.
    """,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Include Routers
app.include_router(air_quality_router)
app.include_router(forecasts_router)

# Mount Frontend SPA if built
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Let API and docs endpoints pass through
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        candidate = frontend_dist / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "message": "Welcome to AirAware API",
            "documentation": "/docs",
            "health": "/api/health",
            "sdg_alignment": ["SDG 3", "SDG 11"]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
