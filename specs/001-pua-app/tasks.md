# Tasks: pua

**Input**: Design documents from `/specs/001-pua-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec; test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend structure: `backend/src/models/`, `backend/src/services/`, `backend/src/api/`, `backend/tests/` per plan.md
- [x] T002 Create frontend structure: `frontend/` with `index.html`, `app.js`, `styles.css` per plan.md
- [x] T003 [P] Add backend dependencies: FastAPI, SQLAlchemy, aiosqlite, uvicorn in `backend/requirements.txt`
- [x] T004 Add database init script at `backend/src/scripts/init_db.py` to create SQLite schema from models
- [x] T005 Add seed script at `backend/src/scripts/seed.py` to load `data/pua_dataset_merged_unique.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

- [x] T006 [P] Create ContentItem model in `backend/src/models/content.py` (id, text, content_type, active, created_at per data-model.md)
- [x] T007 [P] Create Vote model in `backend/src/models/vote.py` (id, content_item_id, vote_type, session_id, created_at per data-model.md)
- [x] T008 Create database module in `backend/src/models/database.py` with SQLite engine, session, init_db
- [x] T009 Implement get_random_content in `backend/src/services/content.py` (filter active, exclude_id, random choice)
- [x] T010 Create FastAPI app in `backend/src/api/main.py` with CORS, lifespan (init_db), GET /api/content, POST /api/votes per contracts/api.md
- [x] T011 Add vote debounce (1s window) and validation in `backend/src/api/main.py` per spec

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - View and Vote on Content (Priority: P1) 🎯 MVP

**Goal**: One random content item full-screen; thumbs up/down; vote persists; animation; next item; no-repeat-in-row; background varies per item.

**Independent Test**: Open app → see content → vote → new item appears. Same item never twice in a row.

### Implementation for User Story 1

- [x] T012 [US1] Create frontend API client in `frontend/app.js`: fetchContent(excludeId), postVote(contentItemId, voteType)
- [x] T013 [US1] Implement session ID in `frontend/app.js`: first-party cookie (persists across refresh; httpOnly optional) per spec — replace sessionStorage with cookie
- [x] T014 [US1] Build full-screen content display in `frontend/index.html` and `frontend/app.js`: show one item, quote-style layout
- [x] T015 [US1] Add thumbs up/down buttons in `frontend/index.html` with aria-labels; wire to postVote in `frontend/app.js`
- [x] T016 [US1] Implement no-repeat-in-row: pass last shown id as exclude_id when fetching next in `frontend/app.js`
- [x] T017 [US1] Add deterministic background per item in `frontend/app.js` and `frontend/styles.css`: derive from item id (e.g. variants[(id-1) % n])
- [x] T018 [US1] Add lightweight transition animation (~300–500ms) in `frontend/styles.css` and `frontend/app.js` between items

**Checkpoint**: User Story 1 fully functional and testable

---

## Phase 4: User Story 2 - Responsive and Readable Experience (Priority: P2)

**Goal**: Full-screen on mobile and desktop; text highly readable; buttons easy to tap; backgrounds preserve readability.

**Independent Test**: Open on mobile and desktop viewports; verify text legibility and tappable buttons.

### Implementation for User Story 2

- [x] T019 [P] [US2] Ensure responsive layout in `frontend/styles.css`: viewport units, max-width, padding for mobile/desktop
- [x] T020 [P] [US2] Verify text contrast and legibility in `frontend/styles.css`: font size, weight, color contrast on all background variants
- [x] T021 [P] [US2] Ensure buttons are tappable (min 44px touch target) in `frontend/styles.css` per mobile UX
- [x] T022 [P] [US2] Add mobile media queries in `frontend/styles.css` for solid backgrounds where gradients reduce readability

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Graceful Loading and Error Handling (Priority: P3)

**Goal**: Loading state while fetching; error state with retry; empty state when no content; vote failure shows feedback and retry.

**Independent Test**: Simulate slow network or errors; verify loading, error, empty, and vote-retry flows.

### Implementation for User Story 3

- [x] T023 [US3] Add loading state UI in `frontend/index.html` and `frontend/app.js`: show while fetching content
- [x] T024 [US3] Add error state UI in `frontend/index.html` and `frontend/app.js`: message + retry button for fetch failures
- [x] T025 [US3] Add empty state in `frontend/index.html` and `frontend/app.js`: "No content available" with clear guidance when no active items
- [x] T026 [US3] Handle vote failure in `frontend/app.js`: show feedback, offer retry button that retries the vote for current item (not load next)
- [x] T027 [US3] Handle cycle-when-all-seen: when fetch returns 404 after excluding last item, cycle by calling fetchContent(null) in `frontend/app.js`

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, final alignment with spec

- [x] T028 [P] Add basic keyboard support in `frontend/app.js`: ArrowUp/u for thumbs up, ArrowDown/d for thumbs down
- [x] T029 [P] Add screen reader support in `frontend/index.html`: aria-labels on buttons, role="main", aria-live for loading
- [x] T030 Run quickstart.md validation: backend + frontend + seed + manual smoke test
- [x] T031 Verify API_BASE configurable (e.g. env or relative URL) in `frontend/app.js` for production

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–5)**: Depend on Foundational
  - US1 (Phase 3): Core loop — must complete first
  - US2 (Phase 4): Responsive/readable — builds on US1
  - US3 (Phase 5): Loading/error — builds on US1
- **Polish (Phase 6)**: Depends on desired user stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no other story dependencies
- **US2 (P2)**: After US1 (extends layout/styling)
- **US3 (P3)**: After US1 (extends error/loading flows)

### Parallel Opportunities

- T003, T006, T007 can run in parallel within their phases
- T019–T022 (US2) can run in parallel
- T028, T029 (Polish) can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test core loop independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → test → MVP
3. Add US2 → test → responsive
4. Add US3 → test → robust
5. Polish → production-ready
