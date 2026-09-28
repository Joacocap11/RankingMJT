from fastapi.testclient import TestClient

API = "/api/v1/monsters"


def _create(client: TestClient, nickname: str, rank_position: int, would_buy_again: bool = True):
    return client.post(
        API,
        json={
            "nickname": nickname,
            "flavor": "SomeFlavor",
            "rank_position": rank_position,
            "would_buy_again": would_buy_again,
        },
    )


def _positions(client: TestClient) -> list[int]:
    resp = client.get(API)
    assert resp.status_code == 200
    return [m["rank_position"] for m in resp.json()]


def _nicknames_in_order(client: TestClient) -> list[str]:
    resp = client.get(API)
    assert resp.status_code == 200
    return [m["nickname"] for m in resp.json()]


def test_a_create_first_monster_at_position_1(client: TestClient):
    resp = _create(client, "First", 1)
    assert resp.status_code == 201
    body = resp.json()
    assert body["rank_position"] == 1
    assert body["nickname"] == "First"


def test_b_insert_at_position_1_shifts_existing_down(client: TestClient):
    _create(client, "One", 1)
    _create(client, "Two", 2)
    _create(client, "Three", 3)

    resp = _create(client, "NewFirst", 1)
    assert resp.status_code == 201
    assert resp.json()["rank_position"] == 1

    order = _nicknames_in_order(client)
    assert order == ["NewFirst", "One", "Two", "Three"]
    assert _positions(client) == [1, 2, 3, 4]


def test_c_insert_at_intermediate_position(client: TestClient):
    _create(client, "One", 1)
    _create(client, "Two", 2)
    _create(client, "Three", 3)

    resp = _create(client, "Middle", 2)
    assert resp.status_code == 201
    assert resp.json()["rank_position"] == 2

    order = _nicknames_in_order(client)
    assert order == ["One", "Middle", "Two", "Three"]
    assert _positions(client) == [1, 2, 3, 4]


def test_d_insert_at_end(client: TestClient):
    _create(client, "One", 1)
    _create(client, "Two", 2)

    resp = _create(client, "Last", 3)
    assert resp.status_code == 201
    assert resp.json()["rank_position"] == 3
    assert _nicknames_in_order(client) == ["One", "Two", "Last"]


def test_e_move_existing_up(client: TestClient):
    for i, name in enumerate(["A", "B", "C", "D"], start=1):
        _create(client, name, i)

    # find id of "D" (position 4) and move it to position 2
    monsters = client.get(API).json()
    d_id = next(m["id"] for m in monsters if m["nickname"] == "D")

    resp = client.put(f"{API}/{d_id}/rank", json={"rank_position": 2})
    assert resp.status_code == 200
    assert resp.json()["rank_position"] == 2

    assert _nicknames_in_order(client) == ["A", "D", "B", "C"]
    assert _positions(client) == [1, 2, 3, 4]


def test_f_move_existing_down(client: TestClient):
    for i, name in enumerate(["A", "B", "C", "D"], start=1):
        _create(client, name, i)

    monsters = client.get(API).json()
    a_id = next(m["id"] for m in monsters if m["nickname"] == "A")

    resp = client.put(f"{API}/{a_id}/rank", json={"rank_position": 3})
    assert resp.status_code == 200
    assert resp.json()["rank_position"] == 3

    assert _nicknames_in_order(client) == ["B", "C", "A", "D"]
    assert _positions(client) == [1, 2, 3, 4]


def test_g_move_to_same_position_is_noop(client: TestClient):
    for i, name in enumerate(["A", "B", "C"], start=1):
        _create(client, name, i)

    monsters = client.get(API).json()
    b_id = next(m["id"] for m in monsters if m["nickname"] == "B")

    resp = client.put(f"{API}/{b_id}/rank", json={"rank_position": 2})
    assert resp.status_code == 200
    assert resp.json()["rank_position"] == 2

    assert _nicknames_in_order(client) == ["A", "B", "C"]
    assert _positions(client) == [1, 2, 3]


def test_h_delete_reorders_remaining_no_gaps(client: TestClient):
    for i, name in enumerate(["A", "B", "C", "D"], start=1):
        _create(client, name, i)

    monsters = client.get(API).json()
    b_id = next(m["id"] for m in monsters if m["nickname"] == "B")

    resp = client.delete(f"{API}/{b_id}")
    assert resp.status_code == 204

    assert _nicknames_in_order(client) == ["A", "C", "D"]
    assert _positions(client) == [1, 2, 3]


def test_i_invalid_rank_position_rejected(client: TestClient):
    _create(client, "A", 1)
    _create(client, "B", 2)

    # <= 0 on create
    resp = _create(client, "Bad", 0)
    assert resp.status_code == 422

    # > N+1 on create (N=2, so max valid is 3)
    resp = _create(client, "Bad", 5)
    assert resp.status_code == 422

    # > N on move (N=2 after the two valid creates)
    monsters = client.get(API).json()
    a_id = next(m["id"] for m in monsters if m["nickname"] == "A")
    resp = client.put(f"{API}/{a_id}/rank", json={"rank_position": 10})
    assert resp.status_code == 422
    assert "detail" in resp.json()

    # <= 0 on move
    resp = client.put(f"{API}/{a_id}/rank", json={"rank_position": 0})
    assert resp.status_code == 422


def test_j_no_duplicate_rank_positions_after_many_ops(client: TestClient):
    for i, name in enumerate(["A", "B", "C", "D", "E"], start=1):
        _create(client, name, i)

    monsters = client.get(API).json()
    ids = {m["nickname"]: m["id"] for m in monsters}

    client.put(f"{API}/{ids['E']}/rank", json={"rank_position": 1})
    client.delete(f"{API}/{ids['B']}")
    _create(client, "F", 2)
    client.put(f"{API}/{ids['C']}", json={"would_buy_again": False})
    client.put(f"{API}/{ids['D']}/rank", json={"rank_position": 3})

    positions = _positions(client)
    assert len(positions) == len(set(positions))
    assert positions == sorted(positions)
    assert positions == list(range(1, len(positions) + 1))


def test_k_get_monsters_ascending_order(client: TestClient):
    _create(client, "First", 1)
    _create(client, "Third", 2)
    _create(client, "Second", 2)

    assert _positions(client) == [1, 2, 3]
    assert _nicknames_in_order(client) == ["First", "Second", "Third"]


def test_l_would_buy_again_update_never_moves_rank(client: TestClient):
    for i, name in enumerate(["A", "B", "C"], start=1):
        _create(client, name, i)

    monsters = client.get(API).json()
    b = next(m for m in monsters if m["nickname"] == "B")
    assert b["rank_position"] == 2

    resp = client.put(f"{API}/{b['id']}", json={"would_buy_again": False})
    assert resp.status_code == 200
    assert resp.json()["rank_position"] == 2
    assert resp.json()["would_buy_again"] is False

    assert _positions(client) == [1, 2, 3]
    assert _nicknames_in_order(client) == ["A", "B", "C"]
