"""
Seed content_items from pua_dataset_merged_unique.json.

Run from backend/: python -m src.scripts.seed
"""

import json
import os
import sqlite3
from pathlib import Path

# Default DB path (same as init_db)
DB_PATH = os.environ.get(
    "DATABASE_URL",
    str(Path(__file__).resolve().parent.parent.parent / "data" / "pua.db"),
)
if DB_PATH.startswith("sqlite:///"):
    DB_PATH = Path(DB_PATH.replace("sqlite:///", "")).resolve().as_posix()
elif not Path(DB_PATH).is_absolute():
    DB_PATH = str(Path(DB_PATH).resolve())

# Path to seed data from project root
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
SEED_FILE = REPO_ROOT / "data" / "pua_dataset_merged_unique.json"


def seed() -> None:
    """Load seed data and insert into content_items."""
    if not SEED_FILE.exists():
        print(f"Seed file not found: {SEED_FILE}")
        return

    with open(SEED_FILE, encoding="utf-8") as f:
        items = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Clear existing content (idempotent seed)
    cur.execute("DELETE FROM content_items")

    for item in items:
        cur.execute(
            "INSERT INTO content_items (id, text, content_type, active) VALUES (?, ?, ?, ?)",
            (item["id"], item["text"], "neg", 1),
        )

    conn.commit()
    conn.close()
    print(f"Seeded {len(items)} content items from {SEED_FILE.name}")


if __name__ == "__main__":
    seed()
