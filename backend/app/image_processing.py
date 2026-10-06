"""Thumbnail generation and safe on-disk cleanup for Monster images.

Layout (kept compatible with existing rows that predate thumbnails):

    uploads/monsters/<uuid>.<ext>          original, as uploaded (unchanged path/behavior)
    uploads/monsters/thumbs/<uuid>.webp    derived thumbnail (new)

``image_path`` on existing rows is never rewritten. Rows created before this
feature simply have ``thumbnail_path is None`` and callers fall back to the
original for display until the backfill script runs.
"""

from pathlib import Path

from PIL import Image, ImageOps

THUMBNAIL_MAX_DIM = 512
THUMBNAIL_QUALITY = 80
THUMBNAILS_SUBDIR = "thumbs"


def thumbnail_relative_path(image_relative_path: str) -> str:
    """Derive the thumbnail's relative path (under UPLOAD_DIR) from an original's.

    ``monsters/<uuid>.png`` -> ``monsters/thumbs/<uuid>.webp``
    """
    original = Path(image_relative_path)
    return str(original.parent / THUMBNAILS_SUBDIR / f"{original.stem}.webp")


def generate_thumbnail(source_path: Path, dest_path: Path) -> None:
    """Read the image at ``source_path`` and write a resized WEBP to ``dest_path``.

    Keeps aspect ratio; longest side capped at ``THUMBNAIL_MAX_DIM`` px. Raises
    on unreadable/corrupt images so callers can decide how to report/skip.
    """
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source_path) as img:
        # Respect EXIF orientation from phone cameras before downsizing.
        img = ImageOps.exif_transpose(img)
        img.thumbnail((THUMBNAIL_MAX_DIM, THUMBNAIL_MAX_DIM), Image.LANCZOS)
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
        img.save(dest_path, format="WEBP", quality=THUMBNAIL_QUALITY, method=6)


def _resolve_within_upload_dir(upload_dir: Path, relative_path: str) -> Path | None:
    """Resolve ``relative_path`` under ``upload_dir``, refusing path escapes.

    Returns ``None`` (never a path outside ``upload_dir``) if the input tries
    to traverse out via ``..`` or an absolute path.
    """
    upload_dir = upload_dir.resolve()
    candidate = (upload_dir / relative_path).resolve()
    try:
        candidate.relative_to(upload_dir)
    except ValueError:
        return None
    return candidate


def delete_uploaded_images(upload_dir: Path, image_path: str | None, thumbnail_path: str | None) -> None:
    """Best-effort delete of an original + thumbnail, confined to ``upload_dir``.

    Silently ignores missing files; never raises, never touches paths outside
    ``upload_dir``.
    """
    for relative_path in (image_path, thumbnail_path):
        if not relative_path:
            continue
        resolved = _resolve_within_upload_dir(upload_dir, relative_path)
        if resolved is None:
            continue
        try:
            resolved.unlink(missing_ok=True)
        except OSError:
            pass
