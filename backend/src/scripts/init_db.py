"""
Initialize SQLite database schema for pua.

Creates content_items and votes tables per data-model.md.
Run from backend/: python -m src.scripts.init_db
"""

import os
import sqlite3
from pathlib import Path

# Default DB path: backend/data/pua.db
DB_PATH = os.environ.get(
    "DATABASE_URL",
    str(Path(__file__).resolve().parent.parent.parent / "data" / "pua.db"),
)
if DB_PATH.startswith("sqlite:///"):
    DB_PATH = DB_PATH.replace("sqlite:///", "")


def init_db() -> None:
    """Create database directory and schema."""
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS content_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL CHECK(length(text) >= 1 AND length(text) <= 2000),
            content_type TEXT NOT NULL CHECK(content_type IN (
                'one_liner', 'joke', 'quote', 'neg', 'observation', 'wisdom'
            )),
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_content_items_active
        ON content_items(active)
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_item_id INTEGER NOT NULL REFERENCES content_items(id),
            vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
            session_id TEXT NOT NULL CHECK(length(session_id) = 36),
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_votes_content_item_id
        ON votes(content_item_id)
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_votes_session_item_created
        ON votes(session_id, content_item_id, created_at)
    """)

    conn.commit()
    conn.close()
    print(f"Database initialized: {DB_PATH}")


if __name__ == "__main__":
    init_db()
