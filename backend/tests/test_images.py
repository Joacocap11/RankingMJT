import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import Settings
from app.generate_thumbnails import backfill
from app.image_processing import delete_monster_images, thumbnail_relative_path
from app.models import Monster

API = "/api/v1/monsters"


def _create(client: TestClient, nickname: str, rank_position: int) -> dict:
    resp = client.post(
        API,
        json={
            "nickname": nickname,
            "flavor": "Test",
            "rank_position": rank_position,
            "would_buy_again": True,
            "notes": None,
        },
    )
    assert resp.status_code == 201
    return resp.json()


def _jpeg_bytes(width: int, height: int) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (width, height), color=(120, 40, 200)).save(buf, format="JPEG")
    return buf.getvalue()


def _upload(client: TestClient, monster_id: int, width: int = 800, height: int = 600, filename: str = "photo.jpg"):
    data = _jpeg_bytes(width, height)
    return client.post(
        f"{API}/{monster_id}/image",
        files={"file": (filename, data, "image/jpeg")},
    )


@pytest.fixture()
def patched_upload_dir(monkeypatch, tmp_path):
    """Redirect app.routers.monsters' settings.UPLOAD_DIR to a scratch dir."""
    fake_settings = Settings(UPLOAD_DIR=str(tmp_path))
    monkeypatch.setattr("app.routers.monsters.get_settings", lambda: fake_settings)
    return tmp_path


def test_a_upload_saves_original(client: TestClient, patched_upload_dir):
    monster = _create(client, "Original", 1)
    original_bytes = _jpeg_bytes(800, 600)
    resp = client.post(
        f"{API}/{monster['id']}/image",
        files={"file": ("photo.jpg", original_bytes, "image/jpeg")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["image_path"] is not None
    saved = patched_upload_dir / body["image_path"]
    assert saved.exists()
    assert saved.read_bytes() == original_bytes


def test_b_upload_generates_thumbnail(client: TestClient, patched_upload_dir):
    monster = _create(client, "Thumbed", 1)
    resp = _upload(client, monster["id"])
    body = resp.json()
    assert body["thumbnail_path"] is not None
    assert body["thumbnail_path"] == thumbnail_relative_path(body["image_path"])
    assert (patched_upload_dir / body["thumbnail_path"]).exists()


def test_c_thumbnail_has_reduced_dimensions(client: TestClient, patched_upload_dir):
    monster = _create(client, "Big", 1)
    resp = _upload(client, monster["id"], width=1600, height=1200)
    body = resp.json()
    with Image.open(patched_upload_dir / body["thumbnail_path"]) as thumb:
        assert max(thumb.size) <= 512
        assert thumb.size[0] < 1600 and thumb.size[1] < 1200
    with Image.open(patched_upload_dir / body["image_path"]) as original:
        assert original.size == (1600, 1200)


def test_d_output_includes_thumbnail(client: TestClient, patched_upload_dir):
    monster = _create(client, "Listed", 1)
    _upload(client, monster["id"])
    resp = client.get(f"{API}/{monster['id']}")
    body = resp.json()
    assert body["thumbnail_path"] is not None
    assert body["thumbnail_path"].endswith(".webp")


def test_e_fallback_when_thumbnail_missing(client: TestClient, db_session):
    """Legacy rows (pre-thumbnail-feature) keep working: thumbnail_path is
    simply null and callers are expected to fall back to image_path."""
    monster = Monster(nickname="Legacy", flavor="Old", rank_position=1, image_path="monsters/legacy.png")
    db_session.add(monster)
    db_session.commit()

    resp = client.get(f"{API}/{monster.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["image_path"] == "monsters/legacy.png"
    assert body["thumbnail_path"] is None


def test_f_replace_cleans_previous_files(client: TestClient, patched_upload_dir):
    monster = _create(client, "Replaced", 1)
    first = _upload(client, monster["id"]).json()
    old_original = patched_upload_dir / first["image_path"]
    old_thumbnail = patched_upload_dir / first["thumbnail_path"]
    assert old_original.exists() and old_thumbnail.exists()

    second = _upload(client, monster["id"], filename="photo2.jpg").json()
    assert second["image_path"] != first["image_path"]
    assert not old_original.exists()
    assert not old_thumbnail.exists()
    assert (patched_upload_dir / second["image_path"]).exists()
    assert (patched_upload_dir / second["thumbnail_path"]).exists()


def test_g_delete_cleans_files(client: TestClient, patched_upload_dir):
    monster = _create(client, "Deleted", 1)
    uploaded = _upload(client, monster["id"]).json()
    original = patched_upload_dir / uploaded["image_path"]
    thumbnail = patched_upload_dir / uploaded["thumbnail_path"]
    assert original.exists() and thumbnail.exists()

    resp = client.delete(f"{API}/{monster['id']}")
    assert resp.status_code == 204
    assert not original.exists()
    assert not thumbnail.exists()


def test_delete_monster_images_refuses_path_traversal(tmp_path):
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    outside_file = tmp_path / "outside.txt"
    outside_file.write_text("do not delete me")

    delete_monster_images(upload_dir, "../outside.txt", None)

    assert outside_file.exists()


def test_h_backfill_idempotent(db_session, tmp_path):
    monster = Monster(nickname="Legacy2", flavor="Old", rank_position=1, image_path="monsters/orig.jpg")
    db_session.add(monster)
    db_session.commit()

    original_path = tmp_path / "monsters" / "orig.jpg"
    original_path.parent.mkdir(parents=True, exist_ok=True)
    original_path.write_bytes(_jpeg_bytes(900, 700))

    generated, skipped, failed = backfill(db_session, tmp_path)
    assert (generated, skipped, failed) == (1, 0, 0)
    db_session.refresh(monster)
    assert monster.thumbnail_path == "monsters/thumbs/orig.webp"
    assert (tmp_path / monster.thumbnail_path).exists()

    generated, skipped, failed = backfill(db_session, tmp_path)
    assert (generated, skipped, failed) == (0, 1, 0)


def test_h2_backfill_reports_and_continues_on_missing_original(db_session, tmp_path):
    monster = Monster(nickname="Missing", flavor="Old", rank_position=1, image_path="monsters/does-not-exist.jpg")
    db_session.add(monster)
    db_session.commit()

    generated, skipped, failed = backfill(db_session, tmp_path)
    assert (generated, skipped, failed) == (0, 0, 1)


def test_i_ranking_unaffected_by_image_upload(client: TestClient, patched_upload_dir):
    for i, name in enumerate(["A", "B", "C"], start=1):
        _create(client, name, i)

    monsters = client.get(API).json()
    middle = next(m for m in monsters if m["nickname"] == "B")
    _upload(client, middle["id"])

    resp = client.get(API)
    ordered = resp.json()
    assert [m["nickname"] for m in ordered] == ["A", "B", "C"]
    assert [m["rank_position"] for m in ordered] == [1, 2, 3]
