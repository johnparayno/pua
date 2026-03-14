# Quickstart: pua

**Branch**: `001-pua-app` | **Date**: 2025-03-14

## Prerequisites

- Python 3.11+
- Node.js 18+ (optional; for frontend dev server if used)

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.api.main:app --reload
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

## Frontend

```bash
cd frontend
# Serve static files (e.g. Python or npx serve)
python -m http.server 3000
# Or: npx serve .
```

App: http://localhost:3000

### Install on iOS (offline use)

1. Open the app in Safari (must be served over HTTPS in production, or use localhost for dev).
2. Tap the Share button, then **Add to Home Screen**.
3. The app installs as a standalone icon and works offline. Swipe right = thumbs up, swipe left = thumbs down.

## Database

SQLite file: `backend/data/pua.db` (or configured path)

Initialize schema:

```bash
cd backend
python -m src.scripts.init_db
```

Seed content from `pua_dataset_merged_unique`:

```bash
python -m src.scripts.seed
# Reads from data/pua_dataset_merged_unique.json
```

## Run Tests

```bash
cd backend
pytest
```

## Environment

| Variable       | Default              | Description           |
|----------------|----------------------|-----------------------|
| DATABASE_URL   | sqlite:///./data/pua.db | DB path        |
| CORS_ORIGINS   | http://localhost:3000 | Allowed frontend origins |
