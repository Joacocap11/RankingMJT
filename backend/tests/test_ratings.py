import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.models import Alfajor, Beer, Monster

KINDS = {
    "monsters": (Monster, {"nickname": "N", "flavor": "F"}),
    "beers": (Beer, {"brand": "B", "name": "N"}),
    "alfajores": (Alfajor, {"brand": "B", "name": "N"}),
}

pytestmark = pytest.mark.parametrize("kind", list(KINDS))


def _api(kind: str) -> str:
    return f"/api/v1/{kind}"


def _create(client: TestClient, kind: str, rank: int, **extra):
    return client.post(_api(kind), json={**KINDS[kind][1], "rank_position": rank, **extra})


@pytest.mark.parametrize("rating", [1, 1.0, 1.5, 5, 7.5, 9.5, 10, "8.5"])
def test_valid_ratings_roundtrip(client, kind, rating):
    resp = _create(client, kind, 1, rating=rating)
    assert resp.status_code == 201, resp.text
    assert resp.json()["rating"] == float(rating)
    assert client.get(f"{_api(kind)}/{resp.json()['id']}").json()["rating"] == float(rating)


@pytest.mark.parametrize("rating", [0, 0.5, 10.5, 6.2, 7.25, -1, -5.5, "abc", True, 11, "NaN"])
def test_invalid_ratings_rejected_on_create_and_update(client, kind, rating):
    assert _create(client, kind, 1, rating=rating).status_code == 422
    created = _create(client, kind, 1, rating=5).json()
    resp = client.put(f"{_api(kind)}/{created['id']}", json={"rating": rating})
    assert resp.status_code == 422
    assert client.get(f"{_api(kind)}/{created['id']}").json()["rating"] == 5.0


def test_create_without_rating_is_null(client, kind):
    resp = _create(client, kind, 1)
    assert resp.status_code == 201
    assert resp.json()["rating"] is None


def test_update_null_clears_and_omission_keeps(client, kind):
    item = _create(client, kind, 1, rating=8.5).json()
    url = f"{_api(kind)}/{item['id']}"
    assert client.put(url, json={"notes": "x"}).json()["rating"] == 8.5
    assert client.put(url, json={"rating": None}).json()["rating"] is None


def test_changing_rating_does_not_change_rank(client, kind):
    for i in range(1, 5):
        _create(client, kind, i, rating=3)
    target = _create(client, kind, 4, rating=8.5).json()
    assert target["rank_position"] == 4
    resp = client.put(f"{_api(kind)}/{target['id']}", json={"rating": 9.0})
    assert resp.json()["rank_position"] == 4
    assert resp.json()["rating"] == 9.0
    # no auto-sort by rating: highest rating stays at #4
    items = client.get(_api(kind)).json()
    assert [i["rank_position"] for i in items] == [1, 2, 3, 4, 5]
    assert items[3]["id"] == target["id"]


def test_moving_rank_does_not_change_rating(client, kind):
    a = _create(client, kind, 1, rating=2.5).json()
    b = _create(client, kind, 2, rating=9.5).json()
    c = _create(client, kind, 3).json()
    assert client.put(f"{_api(kind)}/{c['id']}/rank", json={"rank_position": 1}).status_code == 200
    got = {i["id"]: i for i in client.get(_api(kind)).json()}
    assert got[c["id"]]["rank_position"] == 1 and got[c["id"]]["rating"] is None
    assert got[a["id"]]["rating"] == 2.5
    assert got[b["id"]]["rating"] == 9.5
    # rank change through PUT as well
    client.put(f"{_api(kind)}/{b['id']}", json={"rank_position": 1})
    assert client.get(f"{_api(kind)}/{b['id']}").json()["rating"] == 9.5


@pytest.mark.parametrize("bad", [0, 0.5, 10.5, 7.3, -1])
def test_db_constraint_rejects_invalid_bypassing_api(db_session, kind, bad):
    model, fields = KINDS[kind]
    db_session.add(model(**fields, rank_position=1, rating=bad))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


@pytest.mark.parametrize("good", [None, 1, 1.5, 9.5, 10])
def test_db_constraint_accepts_valid(db_session, kind, good):
    model, fields = KINDS[kind]
    db_session.add(model(**fields, rank_position=1, rating=good))
    db_session.commit()
    table = model.__tablename__
    assert db_session.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() == 1
