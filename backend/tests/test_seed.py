from sqlalchemy.orm import Session

from app.models import Monster
from app.seed import SEED_ROWS, seed


def test_m_seed_creates_exact_20_rows_in_order(db_session: Session):
    seed(db_session)

    rows = db_session.query(Monster).order_by(Monster.rank_position.asc()).all()
    assert len(rows) == 20
    assert len(SEED_ROWS) == 20

    for index, (row, expected) in enumerate(zip(rows, SEED_ROWS), start=1):
        assert row.rank_position == index
        assert row.nickname == expected["nickname"]
        assert row.flavor == expected["flavor"]
        assert row.notes == expected["notes"]
        assert row.would_buy_again == expected["would_buy_again"]
        assert row.image_path is None


def test_n_seed_is_idempotent(db_session: Session):
    seed(db_session)
    assert db_session.query(Monster).count() == 20

    seed(db_session)
    assert db_session.query(Monster).count() == 20
