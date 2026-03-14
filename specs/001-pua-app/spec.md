# Feature Specification: pua

**Feature Branch**: `001-pua-app`  
**Created**: 2025-03-14  
**Status**: Draft  
**Input**: User description: "Build a mobile-first full-screen web app called pua. The app displays one short-form text item at a time, such as a one-liner, short paragraph, joke, quote, neg, observation, or piece of wisdom. Content comes from a database defined separately and should be treated as dynamic data, not hardcoded copy."

## Clarifications

### Session 2025-03-14

- Q: Is the content and vote API already built and available, or do we need to build it as part of this feature? → A: Build API as part of this feature (implement backend + frontend)
- Q: When the user has seen all available content, should the app cycle through content again or show an empty/completion state? → A: Cycle through content again (excluding last shown item)
- Q: When a vote fails to persist, what UX should the app provide? → A: Show feedback and offer manual retry button
- Q: What accessibility requirements apply for v1? → A: Basic keyboard and screen reader support
- Q: What is the expected content volume (affects caching/randomization)? → A: 100–1,000 items (medium curated collection)
- Q: How should session be established and persisted for no-repeat tracking and vote attribution? → A: First-party cookie (persists across refresh; httpOnly optional)
- Q: How should the seed format map to the Content Item model? → A: Map existing JSON/CSV fields to Content Item attributes (id, text, content_type, active, created_at)
- Q: How should the background be chosen per item? → A: Deterministic per content item (e.g., derived from item id; same item → same background)
- Q: What security posture should v1 target for the API? → A: CORS for same-origin or explicit allowed origins; basic input validation
- Q: How long should the duplicate-vote debounce window be? → A: 1 second

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Vote on Content (Priority: P1)

A user opens the app on desktop or mobile. One random active content item is shown full-screen with a changing background. Below the content, the user can press thumbs up or thumbs down. The vote is stored, a short animation plays, and a new random content item is shown. The same content item never appears twice in a row within the same session.

**Why this priority**: This is the core engagement loop. Without it, the app delivers no value.

**Independent Test**: Can be fully tested by opening the app, viewing a content item, voting, and verifying a new item appears. Delivers the primary value of consuming and rating short-form content.

**Acceptance Scenarios**:

1. **Given** the user opens the app, **When** the app loads, **Then** one random active content item is displayed full-screen
2. **Given** a content item is displayed, **When** the user taps thumbs up or thumbs down, **Then** the vote is persisted and a short animation plays
3. **Given** the user has voted, **When** the animation completes, **Then** a new random content item is displayed
4. **Given** the user is in a session, **When** a new item is selected, **Then** the same item that was just shown is never displayed again
5. **Given** the user views content, **When** items change, **Then** the background varies between items

---

### User Story 2 - Responsive and Readable Experience (Priority: P2)

The app provides a full-screen, one-page experience that works well on both mobile and desktop. Content remains the visual focus. Text is highly readable on all screen sizes. Buttons are easy to tap on mobile. The visual design feels minimal, app-like, and smooth. Background variation does not reduce readability.

**Why this priority**: Essential for usability across devices; without it, the experience degrades on key platforms.

**Independent Test**: Can be tested by opening the app on mobile and desktop viewports, verifying text legibility, and confirming buttons are comfortably tappable.

**Acceptance Scenarios**:

1. **Given** the user opens the app on mobile, **When** viewing content, **Then** the layout is responsive and full-screen
2. **Given** the user opens the app on desktop, **When** viewing content, **Then** the layout adapts appropriately
3. **Given** any screen size, **When** content is displayed, **Then** text is highly readable and remains the visual focus
4. **Given** the user is on mobile, **When** tapping thumbs up or thumbs down, **Then** the buttons are easy to tap
5. **Given** backgrounds vary between items, **When** content is displayed, **Then** readability is not reduced

---

### User Story 3 - Graceful Loading and Error Handling (Priority: P3)

The app handles loading and error states cleanly. Users see appropriate feedback when content is loading or when something goes wrong.

**Why this priority**: Improves perceived quality and prevents confusion when the system is slow or unavailable.

**Independent Test**: Can be tested by simulating slow network or errors and verifying appropriate feedback is shown.

**Acceptance Scenarios**:

1. **Given** the app is fetching content, **When** data is not yet available, **Then** a loading state is shown
2. **Given** content fetch fails, **When** an error occurs, **Then** the user sees a clear error state with a path to retry or recover

---

### Edge Cases

- What happens when no active content items exist in the database? The app should show a clear empty state with guidance.
- What happens when the user votes but the vote fails to persist? The app shows feedback and offers a manual retry button; the user is not blocked from continuing.
- What happens when the session has seen all available content? The app cycles through content again, excluding the last shown item (no empty/completion state).
- How does the system handle rapid repeated voting (e.g., double-tap)? The app should debounce or ignore duplicate votes for the same item within a 1-second window.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a full-screen, one-page experience with one content item visible at a time
- **FR-002**: System MUST use responsive layout that works on both desktop and mobile
- **FR-003**: System MUST select content randomly from active items in the database
- **FR-004**: System MUST ensure the same content item is never shown twice in a row within the same session
- **FR-005**: System MUST vary the background between items
- **FR-006**: System MUST provide thumbs up and thumbs down actions below the content
- **FR-007**: System MUST persist each vote to the database
- **FR-008**: System MUST load the next content item automatically after a vote
- **FR-009**: System MUST play a lightweight transition animation between items
- **FR-010**: System MUST use anonymous session-based interaction (no login or user accounts)
- **FR-011**: System MUST handle loading and error states cleanly
- **FR-012**: System MUST treat content as dynamic data from a database, not hardcoded copy
- **FR-013**: System MUST provide basic keyboard and screen reader support for core interactions (view content, vote, retry)

### Key Entities

- **Content Item**: A short-form text item (one-liner, joke, quote, neg, observation, wisdom). Attributes: id, text, content_type, active, created_at. Only active items are eligible for display.
- **Vote**: A user's thumbs up or thumbs down on a content item. Attributes: id, content_item_id, vote_type, session_id, created_at. Linked to content item and anonymous session.

### Assumptions

- Content volume is expected to be 100–1,000 active items (medium curated collection); design for server-side random selection.
- **Seed data**: Content is loaded from `data/pua_dataset_merged_unique.json`. Map fields to Content Item attributes (id, text, content_type, active, created_at); derive or default missing attributes as needed.
- Session identification is sufficient for "no-repeat" tracking and vote attribution; no user accounts are required. Session is stored in a first-party cookie (persists across page refresh; httpOnly optional).
- The database schema and API for content and votes are built as part of this feature; backend and frontend are implemented together, aligned with the entity definitions above.
- "Lightweight" transition animation means brief (under ~500ms) and non-blocking; the next item appears promptly.
- API security (v1): CORS configured for same-origin or explicit allowed origins; basic input validation on vote and content endpoints.
- Background variation refers to visual treatment (e.g., color, gradient, or subtle pattern) that changes per item while preserving text contrast and legibility. Background is deterministic per content item (derived from item id; same item always shows the same background).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the app and see one random content item within 3 seconds on a typical connection
- **SC-002**: Users can complete the vote → next item cycle in under 2 seconds from tap to new content display
- **SC-003**: The same content item is never shown twice in a row within a session (100% compliance)
- **SC-004**: Votes are persisted successfully with no data loss under normal conditions
- **SC-005**: The app works well on both mobile and desktop viewports with readable text and tappable buttons
- **SC-006**: No critical console or runtime errors during normal use
- **SC-007**: Loading and error states are clearly communicated to the user

## Non-Goals (v1)

- No login or user accounts
- No admin panel
- No filtering or search
- No favorites
- No sharing
- No push notifications
- No offline-first requirements
