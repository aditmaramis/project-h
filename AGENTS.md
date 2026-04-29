<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Hibah — LLM Coding Standards

> **Agent-specific workflow instructions** live in `/.instructions/*.md` files.
> This file defines project-wide standards that all agents MUST follow.
>
> **Critical requirement:** Before generating ANY code, you MUST first identify and read every relevant individual instruction file in `/.instructions/` that applies to the task. This is mandatory, not optional. Do not start coding, drafting code, or suggesting code changes until those instruction files have been read.
>
> Available instruction files:
>
> - `/.instructions/auth-patterns.md` — Supabase-only auth, modal sign-in/sign-up, protected routes
> - `/.instructions/ui-components.md` — shadcn/ui-only rule, no custom UI components
> - `/.instructions/i18n-patterns.md` — Internationalization with next-intl, translation keys, locale routing
> - `/.instructions/database-patterns.md` — Prisma + PostgreSQL column naming, raw SQL, migration strategy, seeding
> - `/.instructions/admin-dashboard-plan.md` — Admin dashboard phased implementation plan (Phases 1–5)
>
> If a task touches authentication, read `/.instructions/auth-patterns.md` first. If it touches UI, components, layout, forms, or interactions, read `/.instructions/ui-components.md` first. If it touches translations, locales, or internationalization, read `/.instructions/i18n-patterns.md` first. If it touches database queries, Prisma schema, migrations, raw SQL, or seeding, read `/.instructions/database-patterns.md` first. If a task touches the admin dashboard or any admin feature, read `/.instructions/admin-dashboard-plan.md` first. If multiple instruction files are relevant, read all of them BEFORE generating any code.

---

## Tech Stack (locked versions)

| Layer         | Technology                    | Version      |
| ------------- | ----------------------------- | ------------ |
| Framework     | Next.js (App Router)          | 16.2.x       |
| Language      | TypeScript                    | 5.x (strict) |
| React         | React + RSC                   | 19.x         |
| ORM           | Prisma                        | 7.x          |
| Database      | PostgreSQL (Supabase-managed) | —            |
| Auth          | Supabase Auth                 | —            |
| Styling       | Tailwind CSS                  | 4.x          |
| Component lib | shadcn/ui (base-nova theme)   | —            |
| Validation    | Zod                           | 4.x          |
| i18n          | next-intl                     | 4.x          |
| Maps          | Leaflet + react-leaflet       | 1.9.x / 5.x  |
| Icons         | Lucide React                  | —            |

Do **not** introduce new dependencies without explicit approval.

---

## Critical Next.js 16 Breaking Changes

These differ from your training data. Refer to `node_modules/next/dist/docs/` for current docs.

1. **Middleware is now `proxy.ts`** — The file is called `proxy.ts` at the project root. Export a named `proxy` function (or default export). The `config.matcher` API is unchanged.
2. **`params` is a Promise** — In pages, layouts, and route handlers, `params` must be awaited: `const { id } = await params`.
3. **`searchParams` is a Promise** — Same as params: `const searchParams = await props.searchParams`.
4. **`fetch` is uncached by default** — Requests are NOT cached. Use `use cache` directive or `<Suspense>` for streaming.
5. **Server Functions use `'use server'`** — The `use server` directive marks server actions. Always verify auth inside every server function.

---

## Project Structure

```
app/                   → Root layout (pass-through) + globals.css
  [locale]/            → Locale-based routing segment (en, id)
    (main)/            → Public content with header/footer layout
    chat/              → Messaging UI
    dashboard/         → Authenticated user dashboard
    admin/             → Admin dashboard (ADMIN role required)
  api/                 → Route handlers (REST API) — NOT under [locale]
  auth/                → Supabase OAuth callback — NOT under [locale]

components/            → Reusable React components
  ui/                  → shadcn/ui primitives (Button, etc.)
  layout/              → Header, Footer, TopBar, LanguageSwitcher
  map/                 → Leaflet map components (client-only, dynamic imports)
  admin/               → Admin dashboard components (sidebar, charts)

hooks/                 → Custom React hooks (all 'use client')
i18n/                  → Internationalization config
  routing.ts           → defineRouting (locales, defaultLocale, localePrefix)
  navigation.ts        → Locale-aware Link, useRouter, usePathname, redirect
  request.ts           → getRequestConfig (message loading per locale)
lib/                   → Shared utilities & configs
  generated/prisma/    → Auto-generated Prisma client (DO NOT EDIT)
  supabase/            → Supabase client (browser), server, proxy helpers
  validators/          → Zod schemas
messages/              → Translation JSON files
  en.json              → English translations
  id.json              → Bahasa Indonesia translations
prisma/                → Schema & migrations
types/                 → Shared TypeScript type definitions
```

### Key rules

- **Never edit files in `lib/generated/`** — These are auto-generated by Prisma.
- **All page routes live under `app/[locale]/`** — API routes and OAuth callbacks stay at `app/` root.
- **Route groups** `(main)` use parentheses to avoid URL segments.
- **API routes** go in `app/api/` as `route.ts` files (outside `[locale]`).

---

## Naming Conventions

| What                    | Convention                     | Example                     |
| ----------------------- | ------------------------------ | --------------------------- |
| Files                   | kebab-case                     | `location-picker-inner.tsx` |
| Components              | PascalCase                     | `LocationPicker`            |
| Hooks                   | camelCase with `use` prefix    | `useGeolocation`            |
| Zod schemas             | camelCase with `Schema` suffix | `createItemSchema`          |
| Database models         | PascalCase (Prisma)            | `Profile`, `Item`           |
| Types inferred from Zod | `z.infer<typeof schema>`       | —                           |
| CSS variables           | kebab-case with `--` prefix    | `--primary`                 |

---

## Import Rules

- **Always use the `@/` path alias** — mapped to the project root.
  ```ts
  import { prisma } from '@/lib/prisma';
  import { Button } from '@/components/ui/button';
  import { useGeolocation } from '@/hooks/use-geolocation';
  ```
- **Use `@/i18n/navigation` instead of `next/link` and `next/navigation`** in localized components:
  ```ts
  import { Link, useRouter, usePathname, redirect } from '@/i18n/navigation';
  ```
  The `Link` and `useRouter` from `@/i18n/navigation` are locale-aware wrappers. Use them in all components under `[locale]`.
- **Named exports** for utilities, hooks, and validators.
- **Default exports** for page and layout components (required by Next.js).

---

## Server vs Client Components

**Default is Server Component.** Only add `'use client'` when you need:

- State (`useState`), effects (`useEffect`), or event handlers (`onClick`, `onChange`)
- Browser APIs (`window`, `localStorage`, `navigator.geolocation`)
- Custom hooks
- Third-party client libraries (Leaflet, etc.)

### Pattern: Compose server + client

```tsx
// app/items/[id]/page.tsx — Server Component (default)
import { LikeButton } from '@/components/like-button'; // Client Component

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const item = await prisma.item.findUnique({ where: { id } });
	return <LikeButton itemId={item.id} />;
}
```

---

## Authentication Patterns

### Supabase clients

| Context                            | Module                  | Usage                                 |
| ---------------------------------- | ----------------------- | ------------------------------------- |
| Client components                  | `@/lib/supabase/client` | Browser-side auth, hooks              |
| Server components / route handlers | `@/lib/supabase/server` | `await createClient()` — cookie-aware |
| Proxy (middleware)                 | `@/lib/supabase/proxy`  | Session refresh, route protection     |

### Auth check in API routes (required pattern)

```ts
const supabase = await createClient();
const {
	data: { user },
} = await supabase.auth.getUser();
if (!user) {
	return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Protected routes (proxy.ts)

The proxy composes `next-intl` i18n middleware with Supabase session management. It protects: `/dashboard`, `/chat`, `/admin`, and item creation routes (with locale prefix stripping for route matching). The `/admin` layout additionally checks `profile.role === 'ADMIN'` via Prisma and redirects non-admins to `/`.

---

## API Route Standards

All API routes live in `app/api/` and export named HTTP method handlers.

### Request validation

Always validate request bodies with Zod `safeParse()`:

```ts
const parsed = schema.safeParse(body);
if (!parsed.success) {
	return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
```

### Response format

| Case              | Status | Body                           |
| ----------------- | ------ | ------------------------------ |
| Validation error  | 400    | `{ error: flattenedZodError }` |
| Not authenticated | 401    | `{ error: 'Unauthorized' }`    |
| Not authorized    | 403    | `{ error: 'Forbidden' }`       |
| Not found         | 404    | `{ error: 'Not found' }`       |
| Success (GET)     | 200    | JSON data                      |
| Success (POST)    | 201    | Created resource               |
| Success (PATCH)   | 200    | Updated resource               |

---

## Database Access (Prisma)

- Use the singleton from `@/lib/prisma` — **never** instantiate `PrismaClient` directly.
- Prisma generates to `lib/generated/prisma/` — run `npx prisma generate` after schema changes.
- Use `@prisma/adapter-pg` for connection pooling.
- Env vars: `DATABASE_URL` (pooled, port 6543), `DIRECT_URL` (direct, port 5432).
- **Use `prisma db push`** to sync schema — `prisma migrate dev` fails on Supabase (shadow DB incompatible with `auth` schema).
- SQL triggers/functions in `prisma/migrations/` must be applied **manually** (via Supabase SQL Editor or `pg` client) — `db push` does not run them.

### Column naming (CRITICAL)

Prisma fields use **camelCase without `@map`**, so PostgreSQL columns are **camelCase** (e.g., `"createdAt"`, `"avatarUrl"`, `"categoryId"`). Table names use `@@map` and are **snake_case** (e.g., `profiles`, `admin_actions`). In raw SQL, always **double-quote camelCase columns**: `"createdAt"`, not `created_at`.

See `/.instructions/database-patterns.md` for full reference.

### Prisma schema conventions

- UUIDs for `Profile` (synced from Supabase `auth.users`).
- CUIDs for all other model IDs (`@default(cuid())`).
- Enums: `UserRole`, `ItemCondition`, `ItemStatus`, `ReportStatus`, `ReportTargetType`, `AdminActionType`.
- Always include `createdAt` / `updatedAt` timestamps.
- Use `@@index` for frequently queried fields.
- Use `@@map("snake_case")` on every model for table names.

---

## Validation (Zod)

Validators live in `lib/validators/`. Each domain has its own file:

- `auth.ts` — `loginSchema`, `signupSchema`
- `items.ts` — `createItemSchema`, `updateItemSchema`
- `messages.ts` — `sendMessageSchema`, `createConversationSchema`

### Rules

- Always use `safeParse()`, never `parse()` (avoid throwing).
- Return flattened errors: `parsed.error.flatten()`.
- Infer types from schemas: `type CreateItem = z.infer<typeof createItemSchema>`.

---

## Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss`.
- OKLch color system with CSS custom properties (see `globals.css`).
- Use the `cn()` utility from `@/lib/utils` to merge classes:
  ```ts
  import { cn } from '@/lib/utils';
  cn('base-class', conditional && 'conditional-class');
  ```
- Dark mode via `.dark` class.
- Component variants via `class-variance-authority` (CVA).
- Animations via `tw-animate-css`.

---

## Map Components

Leaflet requires the DOM — all map components must be **client-only**:

```ts
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/map').then(m => m.MapView), {
  ssr: false,
  loading: () => <MapSkeleton />,
})
```

- Use OpenStreetMap tiles with proper attribution.
- Location filtering uses Haversine distance (client-side).

---

## Hooks

All hooks are `'use client'` and live in `hooks/`:

| Hook             | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `useGeolocation` | Browser Geolocation API wrapper (lat, lng, error, loading) |
| `useRealtime`    | Supabase Realtime broadcast channel subscription           |
| `useSupabase`    | Memoized Supabase browser client                           |

---

## Internationalization (i18n)

The app supports **English (`en`)** and **Bahasa Indonesia (`id`)** via `next-intl`.

### Architecture

- **Locale routing**: `localePrefix: 'as-needed'` — English has no URL prefix (`/`), Bahasa uses `/id/`.
- **`proxy.ts`** composes `next-intl/middleware` with Supabase session management.
- **`app/[locale]/layout.tsx`** wraps content in `<NextIntlClientProvider>` and sets `<html lang={locale}>`.
- **Translations** live in `messages/en.json` and `messages/id.json`.

### Translation rules

- **Server Components**: Use `getTranslations('Namespace')` from `next-intl/server`.
- **Client Components**: Use `useTranslations('Namespace')` from `next-intl`.
- **Never hardcode user-facing strings** — always use translation keys.
- **Add keys to BOTH `en.json` and `id.json`** when creating new translations.
- **Use `Link` from `@/i18n/navigation`** instead of `next/link` for locale-aware links.
- **Use `useRouter` from `@/i18n/navigation`** instead of `next/navigation` for locale-aware routing.

### Adding a new translated component

1. Add translation keys to `messages/en.json` and `messages/id.json` under a namespace.
2. In server components: `const t = await getTranslations('MyNamespace');`
3. In client components: `const t = useTranslations('MyNamespace');`
4. Use `t('key')` for strings, `t('key', { param: value })` for interpolation.

### Layout sub-layouts

Every layout under `app/[locale]/` must call `setRequestLocale(locale)` for static rendering support:

```ts
import { setRequestLocale } from 'next-intl/server';
// ...
const { locale } = await params;
setRequestLocale(locale);
```

---

## Scripts Reference

```bash
npm run dev          # Start dev server
npm run build        # Generate Prisma + build
npm run test:e2e     # Run Playwright E2E suite (Chromium)
npm run test:e2e:ui  # Open Playwright UI mode
npm run test:e2e:headed # Run E2E tests in headed browser
npm run test:e2e:report # Open Playwright HTML report
npm run db:migrate   # Run Prisma migrations
npm run db:push      # Push schema to DB (no migration)
npm run db:seed      # Seed categories + promote ADMIN_EMAIL
npm run db:studio    # Open Prisma Studio
```

---

## E2E Testing (Playwright)

- Framework: Playwright (`@playwright/test`) with config in `playwright.config.ts`
- Test location: `e2e/` (current smoke coverage in `e2e/auth-redirect.spec.ts`)
- Selector strategy: prefer stable `data-testid` attributes for auth/menu interactions
- Required env vars for auth smoke tests:
  - `E2E_ADMIN_EMAIL`
  - `E2E_ADMIN_PASSWORD`
  - `E2E_USER_EMAIL`
  - `E2E_USER_PASSWORD`
- Optional env var:
  - `E2E_BASE_URL` (defaults to `http://127.0.0.1:3000`)
- Reliability rules:
  - Use `expect`/`expect.poll` assertions instead of fixed delays
  - Avoid brittle text-only selectors for translated UI
  - Keep PR checks to Chromium; run cross-browser expansion only when needed

---

## Environment Variables

### Required

| Variable                        | Scope  | Purpose                              |
| ------------------------------- | ------ | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public | Supabase project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key               |
| `DATABASE_URL`                  | Server | Prisma pooled connection (port 6543) |
| `DIRECT_URL`                    | Server | Prisma direct connection (port 5432) |
| `ADMIN_EMAIL`                   | Server | Email to promote to ADMIN on seed    |

Never hardcode secrets. Never commit `.env` files.

---

## Do NOT

- Add dependencies without approval
- Edit `lib/generated/` files
- Use `parse()` instead of `safeParse()` for Zod validation
- Instantiate `PrismaClient` outside `lib/prisma.ts`
- Use `middleware.ts` — it is `proxy.ts` in Next.js 16
- Assume `params` or `searchParams` are synchronous — they are Promises
- Skip auth checks in API routes or server functions
- Use `'use client'` on components that don't need it
- Import server-only modules (Prisma, `createClient` from `server.ts`) in client components
- Cache `fetch` requests without explicit reason
- Use `next/link` or `next/navigation` in localized components — use `@/i18n/navigation` instead
- Hardcode user-facing strings — use translation keys from `messages/*.json`
- Add translation keys to only one locale file — always update both `en.json` and `id.json`
- Place page routes outside `app/[locale]/` (except `api/` and `auth/callback`)
- Use snake_case column names in raw SQL — columns are camelCase (e.g., `"createdAt"` not `created_at`)
- Use `prisma migrate dev` on Supabase — use `prisma db push` instead
- Forget to apply trigger/function SQL after `prisma db push` — it only syncs schema, not migration SQL files
- Assume all `auth.users` have a `profiles` row — verify the trigger exists and backfill if needed

---

## Karpathy Skills — Behavioral Coding Principles

> Behavioral guidelines to reduce common LLM coding mistakes.
> Source: [andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
>
> **Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
