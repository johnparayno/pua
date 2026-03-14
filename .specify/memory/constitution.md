<!--
  Sync Impact Report
  Version change: (none) → 1.0.0
  Modified principles: N/A (initial creation)
  Added sections: All (initial ratification)
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (Constitution Check gate aligns)
    - .specify/templates/spec-template.md ✅ (scope/requirements compatible)
    - .specify/templates/tasks-template.md ✅ (task categorization compatible)
    - .cursor/commands/*.md ✅ (no agent-specific references to update)
  Follow-up TODOs: None
-->

# pua Constitution

## Core Principles

### I. Simplicity First

Implementation MUST prioritize simplicity, readability, and predictable behavior over clever architecture. Use small components, explicit data models, and clear separation between UI, data fetching, and persistence. Avoid unnecessary abstraction layers, large frameworks, or speculative features. The core user loop MUST remain extremely simple: load a random content item → display it clearly → allow thumbs up or thumbs down → persist the vote → animate the transition → load the next item.

**Rationale**: Complexity undermines maintainability and increases defect risk. A simple, linear flow keeps the product focused and the codebase understandable.

### II. Content-Focused Minimal Interface

The interface MUST stay minimal so the content remains the focus. The layout MUST be responsive and work smoothly on both mobile and desktop screens. The application is mobile-first and full-screen, displaying one short-form text item at a time. Visual variation (such as changing backgrounds) MAY improve mood and engagement but MUST never reduce text readability.

**Rationale**: The product's value is in the content itself. Any UI element that competes for attention dilutes the experience.

### III. Spec-Bound Development (NON-NEGOTIABLE)

The application MUST never introduce features that are not explicitly defined in the specification. Each feature MUST be implemented incrementally so the core loop remains functional at every stage of development. No speculative or "nice-to-have" features without spec approval.

**Rationale**: Scope creep leads to bloat and violates Simplicity First. Incremental delivery ensures the product stays shippable and testable at all times.

### IV. Session-First & Anonymous Engagement

User interaction MUST be frictionless and anonymous. Session-based interaction is preferred over login systems. Content is fetched from a database and MUST feel random, but the system MUST ensure the same item is not shown twice in a row during a session. Voting MUST be stored reliably so future ranking and analysis of content popularity is possible.

**Rationale**: Friction (e.g., sign-up) reduces engagement. Anonymous sessions maximize reach. Reliable vote persistence enables data-driven content improvement.

### V. Clarity Over Complexity

All implementations MUST favor clarity over complexity: simple folder structure, minimal dependencies, explicit error handling, and easily understandable code. Transitions between items MUST be lightweight and fast, enhancing the experience without slowing down the interaction loop.

**Rationale**: Readable code is maintainable code. Fast transitions keep the core loop snappy and the user engaged.

## Additional Constraints

- **Technology**: Web application (HTML/CSS/JS or equivalent). No heavy frameworks unless justified by spec.
- **Storage**: Database-backed content and vote persistence. Session state for "no-repeat" tracking.
- **Performance**: Transitions MUST be fast; no perceptible lag in the load → display → vote → next cycle.
- **Accessibility**: Text readability is non-negotiable; contrast and legibility MUST be preserved.

## Development Workflow

- Implement features incrementally; the core loop MUST remain functional after each change.
- Validate against the spec before adding new behavior.
- Use the Constitution Check gate in plan.md before Phase 0 research and after Phase 1 design.
- Complexity that violates principles MUST be justified in the plan's Complexity Tracking table.

## Governance

This constitution supersedes ad-hoc practices. All PRs and reviews MUST verify compliance with these principles. Amendments require documentation, approval, and a migration plan where behavior changes. Use specs and plan documents in `specs/` for runtime development guidance. Version bumps follow semantic versioning: MAJOR for backward-incompatible principle changes, MINOR for new principles or material expansions, PATCH for clarifications and typo fixes.

**Version**: 1.0.0 | **Ratified**: 2025-03-14 | **Last Amended**: 2025-03-14
