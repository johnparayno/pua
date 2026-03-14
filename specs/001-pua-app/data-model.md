# Data Model: pua

**Branch**: `001-pua-app` | **Date**: 2025-03-14

## Entities

### ContentItem

Short-form text item (one-liner, joke, quote, observation, wisdom). Only active items are eligible for display.

| Field        | Type         | Constraints                         | Description                    |
|-------------|--------------|-------------------------------------|--------------------------------|
| id          | INTEGER      | PRIMARY KEY, AUTOINCREMENT           | Unique identifier              |
| text        | TEXT         | NOT NULL, length 1–2000              | The displayed content          |
| content_type| TEXT         | NOT NULL, enum (one_liner, joke, quote, neg, observation, wisdom) | Content category |
| active      | BOOLEAN      | NOT NULL, default true               | If false, excluded from selection |
| created_at  | TIMESTAMP    | NOT NULL, default CURRENT_TIMESTAMP  | Creation time                  |

**Validation**:
- `text` must be non-empty and ≤ 2000 chars
- `content_type` must be one of the enum values

**State**: No transitions; `active` is a soft-delete flag.

---

### Vote

User's thumbs up or thumbs down on a content item. Linked to content item and anonymous session.

| Field          | Type      | Constraints                         | Description                    |
|----------------|-----------|-------------------------------------|--------------------------------|
| id             | INTEGER   | PRIMARY KEY, AUTOINCREMENT           | Unique identifier              |
| content_item_id| INTEGER   | NOT NULL, FK → content_items(id)     | Referenced content item        |
| vote_type      | TEXT      | NOT NULL, enum (up, down)            | Thumbs up or thumbs down       |
| session_id     | TEXT      | NOT NULL, length 36                  | Anonymous session UUID         |
| created_at     | TIMESTAMP | NOT NULL, default CURRENT_TIMESTAMP   | When vote was cast             |

**Validation**:
- `vote_type` must be `up` or `down`
- `session_id` must be valid UUID format

**Constraints**:
- Debounce: Ignore duplicate votes for same (content_item_id, session_id) within 1 second per spec.

---

## Relationships

- **ContentItem** 1 — * **Vote**: One content item can have many votes.
- **Vote** * — 1 **ContentItem**: Each vote references exactly one content item.

---

## Session (Client-Side)

Not persisted in DB. Session ID is a UUID generated on first load, stored in a first-party cookie (persists across refresh; httpOnly optional per spec). Used for:
- No-repeat-in-row: Track `last_shown_content_id` in memory.
- Vote attribution: Sent with each vote.

---

## Indexes

- `content_items(active)` — for filtering active items
- `votes(content_item_id)` — for vote counts / analytics
- `votes(session_id, content_item_id, created_at)` — for debounce check

---

## Seed Data Source

**Location**: `data/pua_dataset_merged_unique.json`

| Source field | Target field   | Notes                          |
|--------------|----------------|--------------------------------|
| text         | text           | Direct                         |
| category     | content_type   | "classic_neg" → "neg"          |
| status       | active         | "approved" → true              |
