"""Idempotent backfill: generate thumbnails for existing Monster images.

Run inside the api container (or any environment with DATABASE_URL/UPLOAD_DIR
pointed at the real data) with:

    python -m app.generate_thumbnails

Safe to re-run: rows that already have a ``thumbnail_path`` pointing at an
existing file are skipped without regenerating. Never deletes or modifies
originals. Failures on a single row (missing/corrupt original) are reported
and do not stop processing of the remaining rows.
"""

from pathlib import Path

from app.config import get_settings
from app.database import SessionLocal
from app.image_processing import generate_thumbnail, thumbnail_relative_path
from app.models import Monster


def backfill(db, upload_dir: Path) -> tuple[int, int, int]:
    """Returns (generated, skipped, failed) counts."""
    generated = 0
    skipped = 0
    failed = 0

    monsters = db.query(Monster).filter(Monster.image_path.isnot(None)).all()
    for monster in monsters:
        thumb_relative = thumbnail_relative_path(monster.image_path)
        thumb_abs = upload_dir / thumb_relative

        if monster.thumbnail_path == thumb_relative and thumb_abs.exists():
            skipped += 1
            continue

        source_abs = upload_dir / monster.image_path
        if not source_abs.exists():
            print(f"[FAIL] Monster id={monster.id}: original not found at {source_abs}")
            failed += 1
            continue

        try:
            generate_thumbnail(source_abs, thumb_abs)
        except Exception as exc:  # noqa: BLE001 - report and continue on any decode error
            print(f"[FAIL] Monster id={monster.id}: {exc}")
            failed += 1
            continue

        monster.thumbnail_path = thumb_relative
        db.add(monster)
        db.commit()
        generated += 1
        print(f"[OK] Monster id={monster.id}: thumbnail -> {thumb_relative}")

    return generated, skipped, failed


def main() -> None:
    settings = get_settings()
    upload_dir = Path(settings.UPLOAD_DIR)
    db = SessionLocal()
    try:
        generated, skipped, failed = backfill(db, upload_dir)
    finally:
        db.close()
    print(f"Backfill complete: generated={generated} skipped={skipped} failed={failed}")


if __name__ == "__main__":
    main()
