# Implementation Plan: pua

**Branch**: `001-pua-app` | **Date**: 2026-03-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-pua-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Mobile-first full-screen web app displaying one short-form text item at a time. Users vote thumbs up/down; votes persist; next random item loads with lightweight animation. Content from database; session-based no-repeat tracking. Backend (FastAPI + SQLite) and frontend (vanilla JS) built together.

## Technical Context

**Language/Version**: Python 3.11+ (backend), JavaScript ES2020+ (frontend)  
**Primary Dependencies**: FastAPI (backend), vanilla JS (frontend)  
**Storage**: SQLite (content_items, votes)  
**Testing**: pytest (backend), minimal frontend tests  
**Target Platform**: Web (mobile-first, desktop-responsive)  
**Project Type**: web-service (backend + frontend)  
**Performance Goals**: Content load <3s, vote→next cycle <2s  
**Constraints**: Lightweight transitions (~500ms), text readability non-negotiable  
**Scale/Scope**: 100–1,000 active items, single-writer workload  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✓ | Linear flow: load → display → vote → persist → animate → next. Small components, explicit models. |
| II. Content-Focused Minimal Interface | ✓ | One item full-screen; minimal UI; responsive; backgrounds preserve readability. |
| III. Spec-Bound Development | ✓ | No features beyond spec; incremental delivery. |
| IV. Session-First & Anonymous Engagement | ✓ | First-party cookie session; no login; no-repeat-in-row; vote persistence. |
| V. Clarity Over Complexity | ✓ | Simple folder structure; minimal deps; explicit error handling; fast transitions. |
| Additional: No heavy frameworks | ✓ | Vanilla JS; FastAPI justified for API. |
| Additional: Database-backed | ✓ | SQLite for content and votes. |

**Gate Result**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-pua-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/
```

**Structure Decision**: Web application with separate backend (FastAPI) and frontend (vanilla JS). Backend serves API and can serve static frontend in production. Frontend consumes `/api/content` and `/api/votes`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations. Table omitted.*
