# Floating Chat Widget QA Checklist

Date: \_**\_ / \_\_** / \_**\_
Tester: **\_\_\_\_****
Environment: local / staging / production
Build/Commit: ****\_\_****

## 1. Access and Visibility

### QA-FCW-001: Logged-out visibility

- Priority: P0
- Preconditions: Logged out
- Steps:

1. Open home page.
2. Navigate between pages under [locale] public routes.

- Expected:

1. Floating chat launcher is not visible.
2. No widget panel can be opened.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

### QA-FCW-002: Logged-in visibility

- Priority: P0
- Preconditions: Logged in
- Steps:

1. Open home page.
2. Verify launcher appears.
3. Open and close widget.

- Expected:

1. Launcher is visible and clickable.
2. Sheet opens/closes without errors.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

### QA-FCW-003: Hidden on chat routes

- Priority: P1
- Preconditions: Logged in
- Steps:

1. Open /chat.
2. Open /chat/[conversationId].

- Expected:

1. Launcher is hidden on both routes.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

## 2. Conversation List and Thread

### QA-FCW-004: List load states

- Priority: P1
- Preconditions: Logged in with existing conversations
- Steps:

1. Open widget.
2. Observe loading -> loaded state.

- Expected:

1. Loading state is visible.
2. List appears with user, item title, and last message preview.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

### QA-FCW-005: Empty state

- Priority: P1
- Preconditions: Logged in with no conversations
- Steps:

1. Open widget.

- Expected:

1. Empty state text is shown.
2. No runtime errors.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

### QA-FCW-006: Open thread inline

- Priority: P0
- Preconditions: Logged in with at least one conversation
- Steps:

1. Open widget.
2. Click one conversation row.

- Expected:

1. Thread view opens inside sheet.
2. Back button returns to list.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

### QA-FCW-007: Send message inline

- Priority: P0
- Preconditions: Open thread in widget
- Steps:

1. Send a non-empty message.
2. Try sending empty message.

- Expected:

1. Valid message is sent and rendered in thread.
2. Empty message shows validation error.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

## 3. Unread and Read State

### QA-FCW-008: Unread badge increments

- Priority: P0
- Preconditions: Two user accounts in separate sessions
- Steps:

1. User A opens app.
2. User B sends message to A.

- Expected:

1. Launcher unread badge increments for A.
2. Conversation row unread badge increments.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

### QA-FCW-009: Mark as read in widget thread

- Priority: P0
- Preconditions: Conversation has unread messages
- Steps:

1. Open that conversation in widget.

- Expected:

1. Row unread count clears to zero.
2. Launcher unread total updates accordingly.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

### QA-FCW-010: Mark as read on full page

- Priority: P1
- Preconditions: Conversation has unread messages
- Steps:

1. Open /chat/[conversationId].
2. Return to a non-chat route.

- Expected:

1. Unread state is cleared after opening conversation page.
2. Launcher unread total reflects the read sync.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

## 4. Realtime and Fallback

### QA-FCW-011: Realtime live updates

- Priority: P0
- Preconditions: Realtime enabled, two active sessions
- Steps:

1. Keep widget open for user A.
2. Send new message from user B.

- Expected:

1. Thread/list updates live.
2. No manual refresh needed.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

### QA-FCW-012: Fallback polling behavior

- Priority: P1
- Preconditions: Simulate realtime disconnect or blocked channel
- Steps:

1. Keep user A on non-chat route.
2. Send new message from user B.
3. Wait up to 15 seconds.

- Expected:

1. New message appears via fallback refresh.
2. Realtime fallback notice is shown while disconnected.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

## 5. Locale, Mobile, and Accessibility

### QA-FCW-013: Locale strings

- Priority: P1
- Preconditions: Logged in
- Steps:

1. Test in English locale.
2. Switch to Indonesian locale and reopen widget.

- Expected:

1. Widget labels, errors, and helper text are localized.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

### QA-FCW-014: Mobile safe-area placement

- Priority: P1
- Preconditions: Mobile viewport or real device
- Steps:

1. Open page with launcher.
2. Check launcher position near bottom on devices with safe-area insets.

- Expected:

1. Launcher stays above bottom UI/chin area.
2. Tap target remains fully visible.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

### QA-FCW-015: Keyboard and screen reader basics

- Priority: P1
- Preconditions: Desktop browser
- Steps:

1. Tab to launcher and open widget with keyboard.
2. Navigate controls (back, retry, send, open full page).
3. Check message input has an accessible label.

- Expected:

1. Focus order is logical.
2. Controls are keyboard-usable.
3. No unlabeled critical controls.

- Status: [ ] Pass [ ] Fail
- Notes: ****\_\_****

## Sign-off

- Overall result: [ ] Pass [ ] Fail
- Blocking issues: ****\_\_****
- Follow-up tasks: ****\_\_****
