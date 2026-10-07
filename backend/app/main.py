from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routers.monsters import router as monsters_router
from app.routers.beers import router as beers_router
from app.routers.alfajores import router as alfajores_router

settings = get_settings()

app = FastAPI(title="RankingMJT API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

v1_router = APIRouter(prefix="/api/v1")


@v1_router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


v1_router.include_router(monsters_router)
v1_router.include_router(beers_router)
v1_router.include_router(alfajores_router)
app.include_router(v1_router)
