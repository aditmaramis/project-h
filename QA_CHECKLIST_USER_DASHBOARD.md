# User Dashboard QA Checklist

Date: \_**\_ / \_\_** / **\_\_**
Tester: **********\_\_**********
Environment: `local` / `staging` / `production`
Build/Commit: **********\_\_**********

## 1. Test Data Setup

- [ ] Create account A (donor): personal account
- [ ] Create account B (recipient): personal account
- [ ] Create account C (organization): organization account
- [ ] Confirm all accounts can log in
- [ ] Ensure at least one category exists in database for item creation

## 2. Signup and Auth (Critical)

### QA-AUTH-001: Signup (Personal)

- Priority: P0
- Preconditions: Logged out
- Steps:

1. Open auth modal from header.
2. Switch to Sign up.
3. Fill valid name, email, password.
4. Select account type Personal.
5. Submit.

- Expected:

1. No "database error saving new user" message.
2. User account is created.
3. User can log in immediately or via confirmation flow.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-AUTH-002: Signup (Organization)

- Priority: P0
- Preconditions: Logged out
- Steps:

1. Repeat signup with a fresh email.
2. Select account type Organization.

- Expected:

1. Signup succeeds.
2. User can access dashboard settings.
3. Account type is shown as Organization.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-AUTH-003: Login and Logout

- Priority: P0
- Preconditions: Existing user
- Steps:

1. Log in with valid credentials.
2. Confirm header/dashboard authenticated state.
3. Log out.

- Expected:

1. Login works.
2. Logout works.
3. Protected pages are blocked after logout.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-AUTH-004: Protected Route Redirect

- Priority: P0
- Preconditions: Logged out
- Steps:

1. Directly visit `/dashboard`.
2. Directly visit `/dashboard/items`.
3. Directly visit `/dashboard/settings`.
4. Directly visit `/chat`.

- Expected:

1. Redirect to landing page.
2. No protected content is visible.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

## 3. Dashboard Overview

### QA-DASH-001: Overview Loads

- Priority: P1
- Preconditions: Logged in as account A
- Steps:

1. Open dashboard home.

- Expected:

1. Greeting renders.
2. Stats cards render.
3. Recent items card renders.
4. No runtime errors in UI.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-DASH-002: Empty State

- Priority: P1
- Preconditions: Logged in as a brand-new user with no items/favorites
- Steps:

1. Open dashboard home.

- Expected:

1. Empty state is shown.
2. CTA to post item is visible.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

## 4. My Items (Create, Edit, Delete)

### QA-ITEM-001: Create Item (Valid)

- Priority: P0
- Preconditions: Logged in as account A
- Steps:

1. Open New Item page.
2. Fill title, description, condition, category.
3. Choose map location.
4. Upload 1 image.
5. Submit.

- Expected:

1. Item is created.
2. Redirect to My Items.
3. Item appears in list and detail page.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-ITEM-002: Create Item Validation

- Priority: P0
- Preconditions: Logged in as account A
- Steps:

1. Submit with missing required fields.
2. Try invalid input combinations.

- Expected:

1. Validation errors appear.
2. No server crash.
3. Invalid item is not created.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-ITEM-003: Image Upload Limits

- Priority: P1
- Preconditions: Logged in as account A
- Steps:

1. Try uploading non-image file.
2. Try image larger than limit.
3. Try adding more than 5 images.

- Expected:

1. Invalid files are rejected.
2. User sees understandable feedback.
3. UI remains responsive.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-ITEM-004: Edit Own Item

- Priority: P0
- Preconditions: Account A has at least one AVAILABLE item
- Steps:

1. Click edit from My Items.
2. Change title or description.
3. Save.

- Expected:

1. Changes persist after refresh.
2. Updated data appears in list/detail.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-ITEM-005: Delete Own Item

- Priority: P0
- Preconditions: Account A has at least one item
- Steps:

1. Delete item from My Items.
2. Confirm deletion action.

- Expected:

1. Item disappears from My Items.
2. Item is no longer accessible.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-ITEM-006: Ownership Enforcement

- Priority: P0
- Preconditions: Account A item exists, logged in as account B
- Steps:

1. Attempt to edit/delete account A item via direct URL or API request.

- Expected:

1. Forbidden behavior is enforced.
2. No unauthorized update or deletion occurs.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

## 5. Favorites

### QA-FAV-001: Add to Favorites

- Priority: P1
- Preconditions: Logged in as account B, visible item exists
- Steps:

1. Click favorite button on item.
2. Open Favorites page.

- Expected:

1. Favorite state updates.
2. Item appears in Favorites list.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-FAV-002: Remove from Favorites

- Priority: P1
- Preconditions: Item already favorited by account B
- Steps:

1. Unfavorite from card or detail.
2. Refresh Favorites page.

- Expected:

1. Item is removed from Favorites.
2. Button state remains consistent.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-FAV-003: Favorites Empty State

- Priority: P2
- Preconditions: No favorites for current user
- Steps:

1. Open Favorites page.

- Expected:

1. Empty message appears.
2. Layout is stable.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

## 6. Profile Settings

### QA-PROF-001: Update Name and Bio

- Priority: P0
- Preconditions: Logged in user with existing profile
- Steps:

1. Open dashboard settings.
2. Update name and bio.
3. Save changes.
4. Refresh page.

- Expected:

1. Success state/message appears.
2. Data persists after refresh.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-PROF-002: Avatar Upload

- Priority: P1
- Preconditions: Logged in user
- Steps:

1. Upload valid image as avatar.
2. Save if required.
3. Refresh page.

- Expected:

1. Avatar updates in settings and dashboard sidebar/header.
2. No broken image state.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-PROF-003: Profile Validation

- Priority: P1
- Preconditions: Logged in user
- Steps:

1. Enter invalid name length.
2. Enter overly long bio.
3. Save.

- Expected:

1. Validation error returned.
2. Invalid data not persisted.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

## 7. Donation Flow

### QA-DON-001: Mark Item as Donated

- Priority: P1
- Preconditions: Account A has AVAILABLE item
- Steps:

1. Click mark donated action.
2. Confirm donation.

- Expected:

1. Item status updates to DONATED.
2. Status reflected in My Items and overview stats.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-DON-002: Recipient Selection

- Priority: P2
- Preconditions: Account A has item with conversation participants
- Steps:

1. Open mark donated dialog.
2. Select recipient.
3. Confirm.

- Expected:

1. Recipient list is shown.
2. Action completes successfully.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

## 8. Chat Basic Coverage

### QA-CHAT-001: Start Conversation

- Priority: P1
- Preconditions: Two users exist, item exists
- Steps:

1. Start chat related to item.

- Expected:

1. Conversation is created once.
2. Existing conversation is reused where appropriate.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-CHAT-002: Send Message as Participant

- Priority: P1
- Preconditions: User is a conversation participant
- Steps:

1. Send message in existing conversation.

- Expected:

1. Message is saved and rendered.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-CHAT-003: Participant Authorization

- Priority: P0
- Preconditions: User is not a participant
- Steps:

1. Attempt to post message by direct API call.

- Expected:

1. Request is forbidden.
2. Message is not created.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

## 9. Localization and Routing

### QA-I18N-001: Locale Navigation

- Priority: P1
- Preconditions: App supports en and id locales
- Steps:

1. Repeat key user flows in English.
2. Repeat key user flows in Indonesian.

- Expected:

1. Routing works in both locales.
2. Core labels/messages are translated.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

## 10. API Security Regression Checks

### QA-SEC-001: Unauthorized Access

- Priority: P0
- Preconditions: Logged out
- Steps:

1. Call protected endpoints directly.

- Expected:

1. Protected endpoints return unauthorized behavior.
2. No data leakage.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

### QA-SEC-002: Not Found Handling

- Priority: P1
- Preconditions: Logged in
- Steps:

1. Request non-existing item IDs and resources.

- Expected:

1. Correct not-found behavior.
2. No unhandled exceptions.

- Status: [ ] Pass [ ] Fail
- Notes: ******************\_\_******************

## 11. Release Smoke Suite (Fast)

Run this before each deployment:

- [ ] Smoke-1: Signup new user succeeds (no DB save error)
- [ ] Smoke-2: Login and dashboard load
- [ ] Smoke-3: Create new item
- [ ] Smoke-4: Favorite item from second account
- [ ] Smoke-5: Update profile name/avatar
- [ ] Smoke-6: Mark item donated
- [ ] Smoke-7: Logout and confirm protected route redirect

## 12. Final Sign-Off

- [ ] All P0 tests passed
- [ ] All P1 tests passed or accepted with known issues
- [ ] Bugs logged for failed cases
- [ ] Ready for release approval

Approved by: **********\_\_**********
Date: \_**\_ / \_\_** / **\_\_**
