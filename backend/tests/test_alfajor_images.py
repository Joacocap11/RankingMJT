import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import Settings

API = "/api/v1/alfajores"


def _create(client: TestClient, brand: str, rank_position: int) -> dict:
    resp = client.post(
        API,
        json={
            "brand": brand,
            "name": "Test",
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


def _upload(client: TestClient, alfajor_id: int, width: int = 800, height: int = 600, filename: str = "photo.jpg"):
    data = _jpeg_bytes(width, height)
    return client.post(
        f"{API}/{alfajor_id}/image",
        files={"file": (filename, data, "image/jpeg")},
    )


@pytest.fixture()
def patched_upload_dir(monkeypatch, tmp_path):
    """Redirect app.routers.alfajores' settings.UPLOAD_DIR to a scratch dir."""
    fake_settings = Settings(UPLOAD_DIR=str(tmp_path))
    monkeypatch.setattr("app.routers.alfajores.get_settings", lambda: fake_settings)
    return tmp_path


def test_m_upload_saves_original(client: TestClient, patched_upload_dir):
    alfajor = _create(client, "Original", 1)
    original_bytes = _jpeg_bytes(800, 600)
    resp = client.post(
        f"{API}/{alfajor['id']}/image",
        files={"file": ("photo.jpg", original_bytes, "image/jpeg")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["image_path"].startswith("alfajores/")
    saved = patched_upload_dir / body["image_path"]
    assert saved.exists()
    assert saved.read_bytes() == original_bytes


def test_n_upload_generates_thumbnail(client: TestClient, patched_upload_dir):
    alfajor = _create(client, "Thumbed", 1)
    resp = _upload(client, alfajor["id"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["thumbnail_path"] is not None
    assert body["thumbnail_path"].endswith(".webp")
    assert (patched_upload_dir / body["thumbnail_path"]).exists()


def test_n2_thumbnail_has_reduced_dimensions(client: TestClient, patched_upload_dir):
    alfajor = _create(client, "Big", 1)
    resp = _upload(client, alfajor["id"], width=1600, height=1200)
    body = resp.json()
    with Image.open(patched_upload_dir / body["thumbnail_path"]) as thumb:
        assert max(thumb.size) <= 512
    with Image.open(patched_upload_dir / body["image_path"]) as original:
        assert original.size == (1600, 1200)


def test_fallback_when_thumbnail_missing(client: TestClient, db_session):
    """Legacy-style rows (no image at all) keep working: thumbnail_path is
    simply null, and the API still returns the row without erroring."""
    from app.models import Alfajor

    alfajor = Alfajor(brand="Legacy", name="Old", rank_position=1, image_path=None)
    db_session.add(alfajor)
    db_session.commit()

    resp = client.get(f"{API}/{alfajor.id}")
    body = resp.json()
    assert body["image_path"] is None
    assert body["thumbnail_path"] is None


def test_o_replace_cleans_previous_files(client: TestClient, patched_upload_dir):
    alfajor = _create(client, "Replaced", 1)
    first = _upload(client, alfajor["id"], filename="first.jpg").json()
    first_image = patched_upload_dir / first["image_path"]
    first_thumbnail = patched_upload_dir / first["thumbnail_path"]
    assert first_image.exists()
    assert first_thumbnail.exists()

    second = _upload(client, alfajor["id"], filename="second.jpg").json()
    assert not first_image.exists()
    assert not first_thumbnail.exists()
    assert (patched_upload_dir / second["image_path"]).exists()
    assert (patched_upload_dir / second["thumbnail_path"]).exists()


def test_p_delete_cleans_files(client: TestClient, patched_upload_dir):
    alfajor = _create(client, "Deleted", 1)
    uploaded = _upload(client, alfajor["id"]).json()
    image = patched_upload_dir / uploaded["image_path"]
    thumbnail = patched_upload_dir / uploaded["thumbnail_path"]
    assert image.exists()
    assert thumbnail.exists()

    resp = client.delete(f"{API}/{alfajor['id']}")
    assert resp.status_code == 204
    assert not image.exists()
    assert not thumbnail.exists()


def test_ranking_unaffected_by_image_upload(client: TestClient, patched_upload_dir):
    for i, name in enumerate(["A", "B", "C"], start=1):
        _create(client, name, i)

    resp = client.get(API)
    alfajor_b = next(a for a in resp.json() if a["brand"] == "B")
    _upload(client, alfajor_b["id"])

    ordered = client.get(API).json()
    assert [a["rank_position"] for a in ordered] == [1, 2, 3]
