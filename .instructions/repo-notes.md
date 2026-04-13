# Hibah Project - Repo Notes

## Stack

- Next.js 16.2.1 (Turbopack default, App Router)
- React 19.2.4
- Tailwind CSS 4 + shadcn/ui
- Prisma 7 with `@prisma/adapter-pg`
- Supabase (auth, realtime, storage)
- Zod for validation
- Leaflet + react-leaflet for maps

## Critical Next.js 16 Changes

- `middleware.ts` is renamed to `proxy.ts` with `export function proxy()`
- `params` and `searchParams` are async — must `await props.params`
- Use `PageProps<"/path/[param]">` for typed page props
- Turbopack is default; no `--turbopack` flag needed

## Critical Prisma 7 Changes

- `url`/`directUrl` removed from schema.prisma datasource — only `provider` remains
- Connection URLs go in `prisma.config.ts` (uses `dotenv/config`)
- PrismaClient constructor requires `adapter` or `accelerateUrl`
- We use `@prisma/adapter-pg` with `PrismaPg({ connectionString })`
- Generated client output: `lib/generated/prisma/client` (import from `/client`)
- Seed config lives in `prisma.config.ts` under `migrations.seed` — NOT in `package.json`
- Seed command: `npx tsx prisma/seed.ts`
- **Use `prisma db push`** — `prisma migrate dev` fails on Supabase (shadow DB can't have `auth` schema)
- SQL triggers in `prisma/migrations/` must be applied manually after `db push`

## Column Naming (CRITICAL)

- Prisma fields are camelCase WITHOUT `@map` → PostgreSQL columns are camelCase
- Table names use `@@map("snake_case")` → PostgreSQL tables are snake_case
- In raw SQL: `"createdAt"` (double-quoted), NOT `created_at`
- In raw SQL: `profiles` (unquoted table), `"avatarUrl"` (quoted column)

## Project Structure

- `proxy.ts` — auth session refresh + route protection
- `lib/supabase/` — client.ts, server.ts, proxy.ts (helper)
- `lib/prisma.ts` — singleton PrismaClient
- `lib/validators/` — Zod schemas (auth, items, messages)
- `prisma/schema.prisma` — Profile, Category, Item, Conversation, ConversationParticipant, Message, Report, AdminAction, BannedKeyword
- `prisma/migrations/00000000000000_profile_trigger/` — auto-creates Profile on auth.users insert (must be applied manually)
- Enums: UserRole, ItemCondition, ItemStatus, ReportStatus, ReportTargetType, AdminActionType
- `hooks/` — use-supabase, use-realtime, use-geolocation
- `types/index.ts` — re-exports Prisma types + composite API types

## Route Map

- `/` — Home (app/(main)/page.tsx)
- `/items` — Browse items
- `/items/[id]` — Item detail
- Auth is modal-only (no standalone /login or /signup pages)
- `/dashboard` — User dashboard (protected)
- `/dashboard/items/new` — Create item (protected)
- `/dashboard/items/[id]/edit` — Edit item (protected)
- `/chat` — Conversation list (protected)
- `/chat/[conversationId]` — Chat thread (protected)
- `/admin` — Admin dashboard (protected, ADMIN role required)
- `/admin` layout checks `profile.role === 'ADMIN'` via Prisma; non-admins redirected to `/`
- `/api/items`, `/api/chat`, `/api/profile` — API routes
- `/auth/callback` — Supabase auth code exchange

## Commands

- `npm run dev` — dev server
- `npm run build` — prisma generate + next build
- `npm run db:migrate` — prisma migrate dev
- `npm run db:seed` — seed categories
- `npm run db:studio` — Prisma Studio
