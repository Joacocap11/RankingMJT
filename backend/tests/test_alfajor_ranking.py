from fastapi.testclient import TestClient

API = "/api/v1/alfajores"


def _create(client: TestClient, brand: str, rank_position: int, would_buy_again: bool = True):
    return client.post(
        API,
        json={
            "brand": brand,
            "name": "SomeName",
            "rank_position": rank_position,
            "would_buy_again": would_buy_again,
        },
    )


def _positions(client: TestClient) -> list[int]:
    resp = client.get(API)
    assert resp.status_code == 200
    return [a["rank_position"] for a in resp.json()]


def _brands_in_order(client: TestClient) -> list[str]:
    resp = client.get(API)
    assert resp.status_code == 200
    return [a["brand"] for a in resp.json()]


def test_a_create_first_alfajor_at_position_1(client: TestClient):
    resp = _create(client, "First", 1)
    assert resp.status_code == 201
    body = resp.json()
    assert body["rank_position"] == 1
    assert body["brand"] == "First"


def test_b_insert_at_position_1_shifts_existing_down(client: TestClient):
    _create(client, "One", 1)
    _create(client, "Two", 2)
    _create(client, "Three", 3)
    resp = _create(client, "NewFirst", 1)
    assert resp.status_code == 201
    assert resp.json()["rank_position"] == 1
    assert _brands_in_order(client) == ["NewFirst", "One", "Two", "Three"]
    assert _positions(client) == [1, 2, 3, 4]


def test_c_insert_at_intermediate_position(client: TestClient):
    _create(client, "One", 1)
    _create(client, "Two", 2)
    _create(client, "Three", 3)
    resp = _create(client, "Middle", 2)
    assert resp.status_code == 201
    assert resp.json()["rank_position"] == 2
    assert _brands_in_order(client) == ["One", "Middle", "Two", "Three"]
    assert _positions(client) == [1, 2, 3, 4]


def test_d_insert_at_end(client: TestClient):
    _create(client, "One", 1)
    _create(client, "Two", 2)
    resp = _create(client, "Last", 3)
    assert resp.status_code == 201
    assert resp.json()["rank_position"] == 3
    assert _brands_in_order(client) == ["One", "Two", "Last"]


def test_e_move_existing_up(client: TestClient):
    for i, name in enumerate(["A", "B", "C", "D"], start=1):
        _create(client, name, i)

    resp = client.get(API)
    alfajor_d = next(a for a in resp.json() if a["brand"] == "D")

    resp = client.put(f"{API}/{alfajor_d['id']}/rank", json={"rank_position": 1})
    assert resp.status_code == 200
    assert resp.json()["rank_position"] == 1
    assert _brands_in_order(client) == ["D", "A", "B", "C"]
    assert _positions(client) == [1, 2, 3, 4]


def test_f_move_existing_down(client: TestClient):
    for i, name in enumerate(["A", "B", "C", "D"], start=1):
        _create(client, name, i)

    resp = client.get(API)
    alfajor_a = next(a for a in resp.json() if a["brand"] == "A")

    resp = client.put(f"{API}/{alfajor_a['id']}/rank", json={"rank_position": 4})
    assert resp.status_code == 200
    assert resp.json()["rank_position"] == 4
    assert _brands_in_order(client) == ["B", "C", "D", "A"]
    assert _positions(client) == [1, 2, 3, 4]


def test_g_move_to_same_position_is_noop(client: TestClient):
    for i, name in enumerate(["A", "B", "C"], start=1):
        _create(client, name, i)

    resp = client.get(API)
    alfajor_b = next(a for a in resp.json() if a["brand"] == "B")

    resp = client.put(f"{API}/{alfajor_b['id']}/rank", json={"rank_position": 2})
    assert resp.status_code == 200
    assert resp.json()["rank_position"] == 2
    assert _brands_in_order(client) == ["A", "B", "C"]
    assert _positions(client) == [1, 2, 3]


def test_h_delete_reorders_remaining_no_gaps(client: TestClient):
    for i, name in enumerate(["A", "B", "C", "D"], start=1):
        _create(client, name, i)

    resp = client.get(API)
    alfajor_b = next(a for a in resp.json() if a["brand"] == "B")

    resp = client.delete(f"{API}/{alfajor_b['id']}")
    assert resp.status_code == 204
    assert _brands_in_order(client) == ["A", "C", "D"]
    assert _positions(client) == [1, 2, 3]


def test_i_invalid_rank_position_rejected(client: TestClient):
    _create(client, "A", 1)

    resp = _create(client, "B", 0)
    assert resp.status_code == 422

    resp = _create(client, "B", 3)
    assert resp.status_code == 422

    resp = client.get(API)
    alfajor_a = next(a for a in resp.json() if a["brand"] == "A")

    resp = client.put(f"{API}/{alfajor_a['id']}/rank", json={"rank_position": 0})
    assert resp.status_code == 422

    resp = client.put(f"{API}/{alfajor_a['id']}/rank", json={"rank_position": 5})
    assert resp.status_code == 422


def test_j_no_duplicate_rank_positions_after_many_ops(client: TestClient):
    for i, name in enumerate(["A", "B", "C", "D", "E"], start=1):
        _create(client, name, i)

    resp = client.get(API)
    alfajores = {a["brand"]: a for a in resp.json()}

    client.put(f"{API}/{alfajores['E']['id']}/rank", json={"rank_position": 1})
    client.put(f"{API}/{alfajores['A']['id']}/rank", json={"rank_position": 3})
    _create(client, "F", 2)
    client.delete(f"{API}/{alfajores['C']['id']}")

    positions = _positions(client)
    assert len(positions) == len(set(positions))
    assert positions == list(range(1, len(positions) + 1))


def test_k_get_alfajores_ascending_order(client: TestClient):
    _create(client, "First", 1)
    _create(client, "Third", 2)
    _create(client, "Second", 2)

    assert _positions(client) == [1, 2, 3]
    assert _brands_in_order(client) == ["First", "Second", "Third"]


def test_l_would_buy_again_update_never_moves_rank(client: TestClient):
    for i, name in enumerate(["A", "B", "C"], start=1):
        _create(client, name, i)

    resp = client.get(API)
    alfajor_b = next(a for a in resp.json() if a["brand"] == "B")

    resp = client.put(f"{API}/{alfajor_b['id']}", json={"would_buy_again": False})
    assert resp.status_code == 200
    assert resp.json()["rank_position"] == 2
    assert resp.json()["would_buy_again"] is False
    assert _brands_in_order(client) == ["A", "B", "C"]
