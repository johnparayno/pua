# Research: pua Implementation

**Branch**: `001-pua-app` | **Date**: 2025-03-14

## 1. Storage (SQLite vs PostgreSQL)

**Decision**: SQLite

**Rationale**: For 100–1,000 active items and single-writer workload, SQLite is sufficient and aligns with Constitution (Simplicity First, Clarity Over Complexity). Zero operational overhead. Single file backup. No daemon or server management. Read-heavy workload fits SQLite.

**Alternatives considered**:
- PostgreSQL: Better for multi-writer, scaling, advanced features. Overkill for this scale.

---

## 2. Backend Framework (FastAPI vs Express)

**Decision**: FastAPI (Python 3.11+)

**Rationale**: Simple REST API for content + votes. FastAPI provides built-in validation (Pydantic), auto-generated docs, async support, and less boilerplate. Constitution favors clarity and explicit error handling.

**Alternatives considered**:
- Express.js: Mature ecosystem; requires manual validation and setup. More boilerplate.

---

## 3. Frontend Approach (Vanilla JS vs Framework)

**Decision**: Vanilla JavaScript (ES2020+)

**Rationale**: Constitution: "No heavy frameworks unless justified by spec." The app is single-page, one item at a time, two buttons. No routing, no complex state. Fetch API + DOM updates suffice. Simplicity First.

**Alternatives considered**:
- React/Vue: Adds unnecessary abstraction for this scope.
- Lightweight framework (e.g. Alpine.js): Possible but adds dependency without clear need.

---

## 4. Testing

**Decision**: pytest (backend), minimal frontend tests (browser or Vitest)

**Rationale**: pytest is standard for Python. Backend API tests are primary. Frontend: simple fetch/display/vote flow; minimal unit tests or manual E2E acceptable for v1.

**Alternatives considered**:
- Playwright: Good for E2E; optional for v1.
- Jest: Heavier; Vitest lighter if needed.

---

## 5. Session Identification

**Decision**: First-party cookie (client-generated UUID; persists across refresh; httpOnly optional)

**Rationale**: Per spec clarification: "First-party cookie (persists across refresh; httpOnly optional)". Cookie persists across page refresh and tab close/reopen within same origin. Sufficient for no-repeat-in-row and vote attribution. No server-side session store.

**Alternatives considered**:
- sessionStorage: Does not persist across tab close; spec explicitly chose cookie.
- Server-generated session: Requires session store; adds complexity.
