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
- Seed script uses `npx tsx prisma/seed.ts`

## Project Structure

- `proxy.ts` — auth session refresh + route protection
- `lib/supabase/` — client.ts, server.ts, proxy.ts (helper)
- `lib/prisma.ts` — singleton PrismaClient
- `lib/validators/` — Zod schemas (auth, items, messages)
- `prisma/schema.prisma` — Profile, Category, Item, Conversation, ConversationParticipant, Message
- `prisma/migrations/00000000000000_profile_trigger/` — auto-creates Profile on auth.users insert
- `hooks/` — use-supabase, use-realtime, use-geolocation
- `types/index.ts` — re-exports Prisma types + composite API types

## Route Map

- `/` — Home (app/(main)/page.tsx)
- `/items` — Browse items
- `/items/[id]` — Item detail
- `/login`, `/signup` — Auth routes (app/(auth)/)
- `/dashboard` — User dashboard (protected)
- `/dashboard/items/new` — Create item (protected)
- `/dashboard/items/[id]/edit` — Edit item (protected)
- `/chat` — Conversation list (protected)
- `/chat/[conversationId]` — Chat thread (protected)
- `/api/items`, `/api/chat`, `/api/profile` — API routes
- `/auth/callback` — Supabase auth code exchange

## Commands

- `npm run dev` — dev server
- `npm run build` — prisma generate + next build
- `npm run db:migrate` — prisma migrate dev
- `npm run db:seed` — seed categories
- `npm run db:studio` — Prisma Studio
