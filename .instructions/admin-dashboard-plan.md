# Admin Dashboard — Phased Plan

## Phase 1: Schema + Overview Dashboard ✅ COMPLETE

- Prisma schema: `UserRole`, `ReportStatus`, `ReportTargetType`, `AdminActionType` enums; `role`/`isBanned`/`bannedAt`/`bannedReason` on Profile; `Report`, `AdminAction`, `BannedKeyword` models
- Admin layout (`app/[locale]/admin/layout.tsx`): Supabase auth + ADMIN role gate via Prisma
- Overview page (`app/[locale]/admin/page.tsx`): 6 metric cards (users, signups, items, new items, pending reports, conversations), trend %, items-by-status breakdown, recent admin actions feed
- Charts (`components/admin/overview-charts.tsx`): Tabbed recharts — signups area, items bar, items-by-status donut
- Sidebar (`components/admin/sidebar.tsx`): Collapsible shadcn Sidebar with 5 nav items (Overview, Users, Content, Reports, Keywords)
- API route (`app/api/admin/stats/route.ts`): GET with auth + admin check, parallel queries, BigInt→Number
- Validators (`lib/validators/admin.ts`): `adminStatsQuerySchema`, `banUserSchema`, `warnUserSchema`, `resolveReportSchema`, `bannedKeywordSchema`
- i18n: `Admin` namespace in both `en.json` and `id.json` (~40 keys)
- Seed: `prisma/seed.ts` promotes `ADMIN_EMAIL` to ADMIN role
- Docs: `/.instructions/database-patterns.md`, updated `AGENTS.md` and `repo-notes.md`

## Phase 2: User Management — NOT STARTED

Page: `app/[locale]/admin/users/page.tsx`

Features:

- Paginated user table (avatar, name, email, role, status, joined date)
- Search by name/email
- Filter by role (USER/ADMIN), ban status
- Sort by created date, name
- User detail view / expandable row
- Actions: ban/unban (with reason), warn, promote/demote role
- All actions create `AdminAction` audit entries
- API routes: `app/api/admin/users/route.ts` (GET list), `app/api/admin/users/[id]/route.ts` (PATCH ban/role)

## Phase 3: Content Moderation — NOT STARTED

Page: `app/[locale]/admin/content/page.tsx`

Features:

- Paginated item table (title, donor, category, status, condition, created date)
- Search by title
- Filter by status (AVAILABLE/RESERVED/DONATED), category
- Item detail view with images
- Actions: edit item fields, delete item, change status
- All actions create `AdminAction` audit entries
- API routes: `app/api/admin/items/route.ts` (GET list), `app/api/admin/items/[id]/route.ts` (PATCH/DELETE)

## Phase 4: Reports System ✅ COMPLETE

- Page (`app/[locale]/admin/reports/page.tsx`): SSR reports queue with status tabs (PENDING / REVIEWED / DISMISSED), per-status counts, reporter details, target links, reason/description, and resolution metadata display
- Component (`components/admin/report-status-actions.tsx`): review/dismiss actions with moderation dialog, admin note input, and required reason when dismissing
- API route (`app/api/admin/reports/route.ts`): GET list with optional status filter + grouped status counts, protected by auth and ADMIN role checks
- API route (`app/api/admin/reports/[id]/route.ts`): PATCH resolve/dismiss with `resolveReportSchema` validation, pending-only conflict guard, and resolution metadata updates (`resolvedBy`, `resolvedAt`, `adminNote`)
- Audit logging: every moderation mutation writes an `AdminAction` entry (`RESOLVE_REPORT` / `DISMISS_REPORT`)

## Recent Updates

- Admin login redirect (2026-04-29): after successful sign-in, `ADMIN` users are redirected to `/admin` (`components/login-form.tsx`)
- Server-side fallback (2026-04-29): authenticated `ADMIN` users are redirected from `/dashboard` to `/admin` in dashboard layout (`app/[locale]/dashboard/layout.tsx`)
- Logout redirect cleanup (2026-04-29): sign-out now navigates to `/` to prevent `/?redirectTo=%2Fadmin` after admin logout (`components/layout/header-auth.tsx`, `components/logout-button.tsx`)
- Playwright E2E smoke coverage (2026-04-29): added auth redirect/logout regression checks in `e2e/auth-redirect.spec.ts` with stable auth/menu test IDs

## Phase 5: Banned Keywords — NOT STARTED

Page: `app/[locale]/admin/keywords/page.tsx`

Features:

- Keyword list with active/inactive toggle
- Add new keyword
- Delete keyword
- Keywords used for content filtering (flag items with matching titles/descriptions)
- All actions create `AdminAction` audit entries
- API routes: `app/api/admin/keywords/route.ts` (GET list, POST create), `app/api/admin/keywords/[id]/route.ts` (PATCH toggle, DELETE)

## Technical Notes

- All admin pages are SSR (server components with direct Prisma queries) where possible
- Client components only for interactive elements (search, filters, modals, toggles)
- Every mutating action must verify ADMIN role server-side
- Every mutation creates an `AdminAction` audit log entry
- Use `redirect({ pathname: '/', locale })` from `@/i18n/navigation` (NOT `href`)
- Raw SQL must use double-quoted camelCase columns: `"createdAt"`, not `created_at`
- shadcn SidebarMenuButton uses `render={<Link />}` prop, not `asChild`
