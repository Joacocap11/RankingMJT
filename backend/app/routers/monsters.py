import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Monster
from app.image_processing import delete_monster_images, generate_thumbnail, thumbnail_relative_path
from app.ranking import RankingError, delete_monster, insert_monster, move_monster
from app.schemas import MonsterCreate, MonsterOut, MonsterRankUpdate, MonsterUpdate

router = APIRouter(prefix="/monsters", tags=["monsters"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
EXT_BY_CONTENT_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _get_monster_or_404(db: Session, monster_id: int) -> Monster:
    monster = db.get(Monster, monster_id)
    if monster is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monster not found")
    return monster


@router.get("", response_model=list[MonsterOut])
def list_monsters(db: Session = Depends(get_db)) -> list[Monster]:
    return list(db.execute(select(Monster).order_by(Monster.rank_position.asc())).scalars().all())


@router.get("/{monster_id}", response_model=MonsterOut)
def get_monster(monster_id: int, db: Session = Depends(get_db)) -> Monster:
    return _get_monster_or_404(db, monster_id)


@router.post("", response_model=MonsterOut, status_code=status.HTTP_201_CREATED)
def create_monster(payload: MonsterCreate, db: Session = Depends(get_db)) -> Monster:
    monster = Monster(
        nickname=payload.nickname,
        flavor=payload.flavor,
        would_buy_again=payload.would_buy_again,
        notes=payload.notes,
    )
    try:
        insert_monster(db, monster, payload.rank_position)
    except RankingError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message) from exc
    db.commit()
    db.refresh(monster)
    return monster


@router.put("/{monster_id}", response_model=MonsterOut)
def update_monster(monster_id: int, payload: MonsterUpdate, db: Session = Depends(get_db)) -> Monster:
    monster = _get_monster_or_404(db, monster_id)

    if payload.nickname is not None:
        monster.nickname = payload.nickname
    if payload.flavor is not None:
        monster.flavor = payload.flavor
    if payload.would_buy_again is not None:
        monster.would_buy_again = payload.would_buy_again
    if payload.notes is not None:
        monster.notes = payload.notes

    if payload.rank_position is not None and payload.rank_position != monster.rank_position:
        try:
            move_monster(db, monster, payload.rank_position)
        except RankingError as exc:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message) from exc

    db.commit()
    db.refresh(monster)
    return monster


@router.put("/{monster_id}/rank", response_model=MonsterOut)
def update_monster_rank(monster_id: int, payload: MonsterRankUpdate, db: Session = Depends(get_db)) -> Monster:
    monster = _get_monster_or_404(db, monster_id)
    try:
        move_monster(db, monster, payload.rank_position)
    except RankingError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message) from exc
    db.commit()
    db.refresh(monster)
    return monster


@router.delete("/{monster_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_monster(monster_id: int, db: Session = Depends(get_db)) -> None:
    monster = _get_monster_or_404(db, monster_id)
    settings = get_settings()
    old_image_path = monster.image_path
    old_thumbnail_path = monster.thumbnail_path
    delete_monster(db, monster)
    db.commit()
    delete_monster_images(Path(settings.UPLOAD_DIR), old_image_path, old_thumbnail_path)


@router.post("/{monster_id}/image", response_model=MonsterOut)
async def upload_monster_image(
    monster_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Monster:
    monster = _get_monster_or_404(db, monster_id)
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

    monsters_dir = Path(settings.UPLOAD_DIR) / "monsters"
    monsters_dir.mkdir(parents=True, exist_ok=True)
    dest_path = monsters_dir / filename
    dest_path.write_bytes(contents)

    image_relative_path = f"monsters/{filename}"
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

    old_image_path = monster.image_path
    old_thumbnail_path = monster.thumbnail_path

    monster.image_path = image_relative_path
    monster.thumbnail_path = thumbnail_relative
    db.commit()
    db.refresh(monster)

    if old_image_path and old_image_path != monster.image_path:
        delete_monster_images(Path(settings.UPLOAD_DIR), old_image_path, old_thumbnail_path)

    return monster
