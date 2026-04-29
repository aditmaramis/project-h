# QA Checklist — Admin Reports System

Use this checklist to verify the end-to-end report and moderation flow.

## 1. Basic Access

- [ ] Admin user can open `/admin/reports`.
- [ ] Non-admin user cannot access `/admin/reports` (redirected away).
- [ ] Sidebar "Reports" item navigates correctly.

## 2. Product Report Submission

- [ ] On an item detail page, "Report this product" appears for non-owner users.
- [ ] Item owner does not see the report action.
- [ ] Clicking report opens a dialog.
- [ ] Reason dropdown is required before submitting.
- [ ] Submitting creates a report successfully.
- [ ] Submitting the same report again shows duplicate prevention behavior.

## 3. Reports Queue Page

- [ ] Reports page header and status filters render correctly.
- [ ] Status filter buttons show counts for Pending/Reviewed/Dismissed.
- [ ] Switching status filters updates listed reports.
- [ ] Empty-state message appears when a status has no reports.

## 4. Report Row Data

- [ ] Reporter name and email are shown.
- [ ] Target link opens correctly for item reports.
- [ ] Missing target shows "target unavailable" fallback text.
- [ ] Reason text displays in human-readable format.
- [ ] Created date is localized for the active locale.

## 5. Moderation Actions

- [ ] Pending reports show both "Review report" and "Dismiss report" actions.
- [ ] "Review report" can be submitted with optional note.
- [ ] "Dismiss report" requires a reason before submit.
- [ ] After action, report leaves Pending list and appears in correct status tab.
- [ ] Reviewed/Dismissed reports show resolved date and resolver identity.
- [ ] Admin note is visible for processed reports when provided.

## 6. API Behavior

- [ ] `POST /api/reports` returns 401 for unauthenticated users.
- [ ] `POST /api/reports` returns 403 when reporting own item.
- [ ] `POST /api/reports` returns 409 for duplicate pending report by same user.
- [ ] `GET /api/admin/reports` returns 403 for non-admin users.
- [ ] `PATCH /api/admin/reports/:id` returns 400 when dismiss reason is missing.
- [ ] `PATCH /api/admin/reports/:id` returns 409 when report already processed.

## 7. i18n Checks

- [ ] All new report/admin moderation labels appear in English locale.
- [ ] All new report/admin moderation labels appear in Indonesian locale.
- [ ] No raw translation keys are displayed in UI.

## 8. Regression Checks

- [ ] Existing admin overview page (`/admin`) still loads correctly.
- [ ] Existing item detail actions (chat, favorite, share) still work.
- [ ] No TypeScript or lint errors introduced by this feature.
