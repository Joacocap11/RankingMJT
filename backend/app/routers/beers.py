import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Beer
from app.image_processing import delete_uploaded_images, generate_thumbnail, thumbnail_relative_path
from app.ranking import RankingError, delete_entity, insert_entity, move_entity
from app.schemas import BeerCreate, BeerOut, BeerRankUpdate, BeerUpdate

router = APIRouter(prefix="/beers", tags=["beers"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
EXT_BY_CONTENT_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _get_beer_or_404(db: Session, beer_id: int) -> Beer:
    beer = db.get(Beer, beer_id)
    if beer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beer not found")
    return beer


@router.get("", response_model=list[BeerOut])
def list_beers(db: Session = Depends(get_db)) -> list[Beer]:
    return list(db.execute(select(Beer).order_by(Beer.rank_position.asc())).scalars().all())


@router.get("/{beer_id}", response_model=BeerOut)
def get_beer(beer_id: int, db: Session = Depends(get_db)) -> Beer:
    return _get_beer_or_404(db, beer_id)


@router.post("", response_model=BeerOut, status_code=status.HTTP_201_CREATED)
def create_beer(payload: BeerCreate, db: Session = Depends(get_db)) -> Beer:
    beer = Beer(
        brand=payload.brand,
        name=payload.name,
        would_buy_again=payload.would_buy_again,
        notes=payload.notes,
    )
    try:
        insert_entity(db, Beer, beer, payload.rank_position)
    except RankingError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message) from exc
    db.commit()
    db.refresh(beer)
    return beer


@router.put("/{beer_id}", response_model=BeerOut)
def update_beer(beer_id: int, payload: BeerUpdate, db: Session = Depends(get_db)) -> Beer:
    beer = _get_beer_or_404(db, beer_id)

    if payload.brand is not None:
        beer.brand = payload.brand
    if payload.name is not None:
        beer.name = payload.name
    if payload.would_buy_again is not None:
        beer.would_buy_again = payload.would_buy_again
    if payload.notes is not None:
        beer.notes = payload.notes

    if payload.rank_position is not None and payload.rank_position != beer.rank_position:
        try:
            move_entity(db, Beer, beer, payload.rank_position)
        except RankingError as exc:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message) from exc

    db.commit()
    db.refresh(beer)
    return beer


@router.put("/{beer_id}/rank", response_model=BeerOut)
def update_beer_rank(beer_id: int, payload: BeerRankUpdate, db: Session = Depends(get_db)) -> Beer:
    beer = _get_beer_or_404(db, beer_id)
    try:
        move_entity(db, Beer, beer, payload.rank_position)
    except RankingError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message) from exc
    db.commit()
    db.refresh(beer)
    return beer


@router.delete("/{beer_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_beer(beer_id: int, db: Session = Depends(get_db)) -> None:
    beer = _get_beer_or_404(db, beer_id)
    settings = get_settings()
    old_image_path = beer.image_path
    old_thumbnail_path = beer.thumbnail_path
    delete_entity(db, Beer, beer)
    db.commit()
    delete_uploaded_images(Path(settings.UPLOAD_DIR), old_image_path, old_thumbnail_path)


@router.post("/{beer_id}/image", response_model=BeerOut)
async def upload_beer_image(
    beer_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Beer:
    beer = _get_beer_or_404(db, beer_id)
    settings = get_settings()

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported content type '{file.content_type}'. Allowed: {sorted(ALLOWED_CONTENT_TYPES)}",
        )

    max_bytes = settings.UPLOAD_MAX_MB * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File exceeds maximum allowed size of {settings.UPLOAD_MAX_MB} MB",
        )

    ext = EXT_BY_CONTENT_TYPE[file.content_type]
    filename = f"{uuid.uuid4()}{ext}"

    beers_dir = Path(settings.UPLOAD_DIR) / "beers"
    beers_dir.mkdir(parents=True, exist_ok=True)
    dest_path = beers_dir / filename
    dest_path.write_bytes(contents)

    image_relative_path = f"beers/{filename}"
    thumbnail_relative = thumbnail_relative_path(image_relative_path)
    thumbnail_dest = Path(settings.UPLOAD_DIR) / thumbnail_relative
    try:
        generate_thumbnail(dest_path, thumbnail_dest)
    except Exception as exc:  # noqa: BLE001 - Pillow raises varied decode errors
        dest_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is not a valid/readable image.",
        ) from exc

    old_image_path = beer.image_path
    old_thumbnail_path = beer.thumbnail_path

    beer.image_path = image_relative_path
    beer.thumbnail_path = thumbnail_relative
    db.commit()
    db.refresh(beer)

    if old_image_path and old_image_path != beer.image_path:
        delete_uploaded_images(Path(settings.UPLOAD_DIR), old_image_path, old_thumbnail_path)

    return beer
