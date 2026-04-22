# Floating Chat Widget Plan

## Goal

Add a logged-in floating chat launcher that opens a side panel for quick conversation access from anywhere in localized pages, while keeping the existing chat pages as the full experience.

## Status

- Phase 1: Completed
- Phase 2: Completed
- Phase 3: Completed
- Phase 4: Completed
- Phase 5: In progress

## Why This Approach

- Reuses existing chat data and auth patterns (`/api/chat`, Supabase Auth, protected `/chat` routes).
- Minimizes risk by shipping in phases.
- Keeps fallback UX intact (`/chat` and `/chat/[conversationId]` remain canonical chat pages).

## Scope

### In Scope

- Global floating launcher for authenticated users
- Side panel shell (Sheet)
- Conversation list with latest message preview
- Quick navigation into a specific conversation
- Internationalized widget strings (`en`, `id`)

### Out of Scope (Later Phases)

- Live unread badge and read synchronization
- Real-time message stream in widget thread
- Typing/presence indicators
- Delivery state indicators

## Phase Plan

## Phase 1: Launcher + Sheet + Conversation List

### Deliverables

- Global mount in locale layout
- `FloatingChatWidgetServer` (auth-gated server wrapper)
- `FloatingChatWidget` client component
- Conversation list loaded from `GET /api/chat`
- Entry points to full chat pages

### Acceptance Criteria

- Widget is visible only when user is logged in
- Widget is hidden on `/chat` routes
- Opening widget shows conversations and latest message preview
- Empty and error states are localized
- No regressions to existing header/auth/chat pages

### Risks

- Additional request to `GET /api/chat` when widget opens
- Potential stale list until later real-time phase

### Mitigation

- Fetch on demand (when opening sheet)
- Add retry action
- Phase 3+ introduces unread + live updates

## Phase 2: Inline Thread View in Widget

### Deliverables

- Select conversation in panel to show thread
- Inline composer in widget panel
- Keep navigation to full chat page as escape hatch

### Implemented

- Added `GET /api/chat/[conversationId]` endpoint with auth and participant checks
- Added list-to-thread interaction in `FloatingChatWidget`
- Added inline message composer in thread view via existing `POST /api/chat`
- Added quick action to open the full conversation page from thread view
- Added Phase 2 i18n keys for thread loading/error/back actions

## Phase 3: Read State + Unread Badge

### Deliverables

- API endpoint to mark incoming messages read
- Unread count surfaced on launcher badge
- Read state synchronization when opening thread

### Implemented

- Added unread message aggregation to `GET /api/chat` response (`unreadCount` per conversation)
- Added `PATCH /api/chat/[conversationId]` to mark incoming unread messages as read
- Updated floating widget launcher badge to use total unread message count
- Updated conversation list rows in the widget to show per-conversation unread badges
- Triggered read sync when opening a thread from the widget
- Marked incoming messages as read on full conversation page load (`/chat/[conversationId]`)

## Phase 4: Realtime Updates

### Deliverables

- Subscribe to Supabase realtime message events
- Live updates for conversation previews and unread badge
- Robust fallback behavior if realtime channel drops

### Implemented

- Added Supabase realtime subscription in `FloatingChatWidget` for new `messages` inserts
- Applied live conversation preview updates when new messages arrive
- Applied live unread badge updates (launcher total + per-conversation badges)
- Added disconnected fallback polling to refresh conversations/thread every 15s when realtime is not subscribed

## Phase 5: Polish and QA

### Deliverables

- Mobile behavior tuning and accessibility pass
- Performance checks and query sanity checks
- End-to-end QA for locale routing and auth transitions

### Implemented (In Progress)

- Tuned floating launcher for mobile safe-area spacing
- Added accessibility improvements: explicit ARIA labels, live regions, list semantics, and busy state indicators
- Added performance guards: skip realtime/polling on `/chat` pages and skip fallback polling while tab is not visible

### Remaining

- Execute full manual QA pass for auth/locale/realtime flows
- Capture pass/fail results and edge-case findings

## Implementation Notes

- Follow Supabase-only auth constraints.
- Use shadcn/ui primitives for all widget UI.
- Keep all user-facing text in translation files.
- Keep API auth checks server-side for any new endpoints.
