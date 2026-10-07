import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Alfajor
from app.image_processing import delete_uploaded_images, generate_thumbnail, thumbnail_relative_path
from app.ranking import RankingError, delete_entity, insert_entity, move_entity
from app.schemas import AlfajorCreate, AlfajorOut, AlfajorRankUpdate, AlfajorUpdate

router = APIRouter(prefix="/alfajores", tags=["alfajores"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
EXT_BY_CONTENT_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _get_alfajor_or_404(db: Session, alfajor_id: int) -> Alfajor:
    alfajor = db.get(Alfajor, alfajor_id)
    if alfajor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alfajor not found")
    return alfajor


@router.get("", response_model=list[AlfajorOut])
def list_alfajores(db: Session = Depends(get_db)) -> list[Alfajor]:
    return list(db.execute(select(Alfajor).order_by(Alfajor.rank_position.asc())).scalars().all())


@router.get("/{alfajor_id}", response_model=AlfajorOut)
def get_alfajor(alfajor_id: int, db: Session = Depends(get_db)) -> Alfajor:
    return _get_alfajor_or_404(db, alfajor_id)


@router.post("", response_model=AlfajorOut, status_code=status.HTTP_201_CREATED)
def create_alfajor(payload: AlfajorCreate, db: Session = Depends(get_db)) -> Alfajor:
    alfajor = Alfajor(
        brand=payload.brand,
        name=payload.name,
        would_buy_again=payload.would_buy_again,
        notes=payload.notes,
    )
    try:
        insert_entity(db, Alfajor, alfajor, payload.rank_position)
    except RankingError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message) from exc
    db.commit()
    db.refresh(alfajor)
    return alfajor


@router.put("/{alfajor_id}", response_model=AlfajorOut)
def update_alfajor(alfajor_id: int, payload: AlfajorUpdate, db: Session = Depends(get_db)) -> Alfajor:
    alfajor = _get_alfajor_or_404(db, alfajor_id)

    if payload.brand is not None:
        alfajor.brand = payload.brand
    if payload.name is not None:
        alfajor.name = payload.name
    if payload.would_buy_again is not None:
        alfajor.would_buy_again = payload.would_buy_again
    if payload.notes is not None:
        alfajor.notes = payload.notes

    if payload.rank_position is not None and payload.rank_position != alfajor.rank_position:
        try:
            move_entity(db, Alfajor, alfajor, payload.rank_position)
        except RankingError as exc:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message) from exc

    db.commit()
    db.refresh(alfajor)
    return alfajor


@router.put("/{alfajor_id}/rank", response_model=AlfajorOut)
def update_alfajor_rank(alfajor_id: int, payload: AlfajorRankUpdate, db: Session = Depends(get_db)) -> Alfajor:
    alfajor = _get_alfajor_or_404(db, alfajor_id)
    try:
        move_entity(db, Alfajor, alfajor, payload.rank_position)
    except RankingError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message) from exc
    db.commit()
    db.refresh(alfajor)
    return alfajor


@router.delete("/{alfajor_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_alfajor(alfajor_id: int, db: Session = Depends(get_db)) -> None:
    alfajor = _get_alfajor_or_404(db, alfajor_id)
    settings = get_settings()
    old_image_path = alfajor.image_path
    old_thumbnail_path = alfajor.thumbnail_path
    delete_entity(db, Alfajor, alfajor)
    db.commit()
    delete_uploaded_images(Path(settings.UPLOAD_DIR), old_image_path, old_thumbnail_path)


@router.post("/{alfajor_id}/image", response_model=AlfajorOut)
async def upload_alfajor_image(
    alfajor_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Alfajor:
    alfajor = _get_alfajor_or_404(db, alfajor_id)
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

    alfajores_dir = Path(settings.UPLOAD_DIR) / "alfajores"
    alfajores_dir.mkdir(parents=True, exist_ok=True)
    dest_path = alfajores_dir / filename
    dest_path.write_bytes(contents)

    image_relative_path = f"alfajores/{filename}"
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

    old_image_path = alfajor.image_path
    old_thumbnail_path = alfajor.thumbnail_path

    alfajor.image_path = image_relative_path
    alfajor.thumbnail_path = thumbnail_relative
    db.commit()
    db.refresh(alfajor)

    if old_image_path and old_image_path != alfajor.image_path:
        delete_uploaded_images(Path(settings.UPLOAD_DIR), old_image_path, old_thumbnail_path)

    return alfajor
