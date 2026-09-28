"""Idempotent seed script for the 20 Monster cans.

Run inside the api container with:
    python -m app.seed
"""

from app.database import SessionLocal
from app.models import Monster

SEED_ROWS: list[dict] = [
    {"nickname": "Negra", "flavor": "Normal", "notes": "Guarina", "would_buy_again": True},
    {"nickname": "Negra Zero Azúcar", "flavor": "Normal", "notes": None, "would_buy_again": True},
    {"nickname": "Blanca", "flavor": "Guarina Ultra", "notes": None, "would_buy_again": True},
    {"nickname": "Azul y Amarilla", "flavor": "Aussie Lemonade", "notes": None, "would_buy_again": True},
    {"nickname": "Rosadita", "flavor": "Pipeline Punch", "notes": None, "would_buy_again": True},
    {"nickname": "NegriVerde", "flavor": "Super Dry Nitro", "notes": None, "would_buy_again": True},
    {"nickname": "Naranjita", "flavor": "Khaotic Tropical Orange", "notes": None, "would_buy_again": True},
    {"nickname": "NegriAzul", "flavor": "Absoletuly Zero", "notes": None, "would_buy_again": True},
    {"nickname": "Verde", "flavor": "Ultra Paradise", "notes": None, "would_buy_again": True},
    {"nickname": "Verde", "flavor": "Dragón Tea Ice Lemon", "notes": None, "would_buy_again": True},
    {"nickname": "Roja Navideña", "flavor": "Ultra Watermelón", "notes": None, "would_buy_again": True},
    {"nickname": "Naranja", "flavor": "Juice Khaos", "notes": None, "would_buy_again": True},
    {"nickname": "NegriAmarilla", "flavor": "White Pineaplle", "notes": None, "would_buy_again": True},
    {"nickname": "Violeta", "flavor": "Ultra Violet", "notes": None, "would_buy_again": False},
    {"nickname": "Dorada", "flavor": "Ultra Golden Pineaple", "notes": None, "would_buy_again": False},
    {"nickname": "Rosadita", "flavor": "Ultra Peachy Keen", "notes": None, "would_buy_again": False},
    {"nickname": "Cremita", "flavor": "Pacific Punch", "notes": None, "would_buy_again": False},
    {"nickname": "Azul", "flavor": "Ultra Fiesta Mango", "notes": None, "would_buy_again": False},
    {"nickname": "Azul", "flavor": "Mango Loco", "notes": None, "would_buy_again": False},
    {"nickname": "Naranja", "flavor": "Tea Ice", "notes": None, "would_buy_again": False},
]


def seed(db) -> None:
    existing_count = db.query(Monster).count()
    if existing_count > 0:
        print(f"Seed skipped: {existing_count} Monster row(s) already present.")
        return

    for index, row in enumerate(SEED_ROWS, start=1):
        db.add(
            Monster(
                nickname=row["nickname"],
                flavor=row["flavor"],
                rank_position=index,
                would_buy_again=row["would_buy_again"],
                notes=row["notes"],
                image_path=None,
            )
        )
    db.commit()
    print(f"Seed complete: inserted {len(SEED_ROWS)} Monster rows.")


def main() -> None:
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
