---
description: Prisma + PostgreSQL database access patterns, raw SQL conventions, migration strategy for Supabase
applyTo: '**/*.{ts,tsx,sql,prisma}'
---

# Database Patterns — Prisma 7 + Supabase PostgreSQL

## Column Naming: camelCase in PostgreSQL

The Prisma schema uses **camelCase field names without `@map`** directives. This means the actual PostgreSQL column names are **camelCase**, not snake_case.

| Prisma field | Actual PG column | NOT this       |
| ------------ | ---------------- | -------------- |
| `createdAt`  | `"createdAt"`    | ~~created_at~~ |
| `updatedAt`  | `"updatedAt"`    | ~~updated_at~~ |
| `avatarUrl`  | `"avatarUrl"`    | ~~avatar_url~~ |
| `categoryId` | `"categoryId"`   | ~~category_id~ |
| `isBanned`   | `"isBanned"`     | ~~is_banned~~  |
| `bannedAt`   | `"bannedAt"`     | ~~banned_at~~  |
| `resolvedAt` | `"resolvedAt"`   | ~~resolved_at~ |
| `targetType` | `"targetType"`   | ~~target_type~ |
| `actionType` | `"actionType"`   | ~~action_type~ |

**Table names ARE snake_case** because models use `@@map("table_name")`:

| Prisma model              | PG table name               |
| ------------------------- | --------------------------- |
| `Profile`                 | `profiles`                  |
| `Item`                    | `items`                     |
| `Category`                | `categories`                |
| `Conversation`            | `conversations`             |
| `ConversationParticipant` | `conversation_participants` |
| `Message`                 | `messages`                  |
| `Report`                  | `reports`                   |
| `AdminAction`             | `admin_actions`             |
| `BannedKeyword`           | `banned_keywords`           |

### Raw SQL rules

When writing `$queryRawUnsafe` or `$queryRaw`, always:

1. **Double-quote camelCase column names**: `"createdAt"`, `"avatarUrl"`, `"categoryId"`
2. **Use unquoted snake_case for table names**: `profiles`, `admin_actions`
3. **Use parameterized queries** (`$1`, `$2`) — never interpolate values

```ts
// ✅ CORRECT
prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
	`SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
   FROM profiles
   WHERE "createdAt" >= $1
   GROUP BY DATE("createdAt")
   ORDER BY date ASC`,
	sinceDate,
);

// ❌ WRONG — will fail with "column created_at does not exist"
prisma.$queryRawUnsafe(`SELECT DATE(created_at) ...`);
```

### Prefer Prisma Client over raw SQL

Use `$queryRawUnsafe` only when Prisma Client cannot express the query (e.g., `DATE()` grouping, window functions). For all standard CRUD, filtering, and aggregation, use the Prisma Client API.

---

## Migration Strategy: Supabase Compatibility

### `prisma db push` — NOT `prisma migrate dev`

Supabase uses a managed PostgreSQL instance with an `auth` schema that Prisma's shadow database cannot replicate. This causes `prisma migrate dev` to fail.

**Use `prisma db push`** to sync schema changes to the database:

```bash
npx prisma db push     # Applies schema changes directly (no migration history)
npx prisma generate    # Regenerate client after schema changes
```

### SQL migrations (triggers, functions, RLS)

Files in `prisma/migrations/` contain **manual SQL** (triggers, functions, RLS policies) that `prisma db push` does NOT execute. These must be applied separately:

- **Via Supabase SQL Editor** (recommended), or
- **Via a script** using the `pg` client with `DIRECT_URL`

The trigger in `prisma/migrations/00000000000000_profile_trigger/migration.sql` auto-creates a `profiles` row when a new user signs up in Supabase Auth. If the trigger is missing, users will have `auth.users` entries but no `profiles` rows.

### Backfilling profiles

If users signed up before the trigger was applied, backfill with:

```sql
INSERT INTO public.profiles (id, email, name, "avatarUrl", "createdAt", "updatedAt")
SELECT
  u.id, u.email,
  COALESCE(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name'),
  u.raw_user_meta_data ->> 'avatar_url',
  NOW(), NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

---

## Connection URLs

| Env var        | Port | Purpose                               | Pooling    |
| -------------- | ---- | ------------------------------------- | ---------- |
| `DATABASE_URL` | 6543 | App runtime (Prisma Client queries)   | PgBouncer  |
| `DIRECT_URL`   | 5432 | Migrations, seed, raw DDL/trigger SQL | No pooling |

`prisma.config.ts` uses `DIRECT_URL` with fallback to `DATABASE_URL`. The seed command is configured as:

```ts
// prisma.config.ts
migrations: {
  path: 'prisma/migrations',
  seed: 'npx tsx prisma/seed.ts',
}
```

---

## Seeding

The seed script (`prisma/seed.ts`) does two things:

1. **Upserts categories** — 8 default categories
2. **Promotes admin** — If `ADMIN_EMAIL` env var is set, updates the matching profile's role to `ADMIN`

Run with: `npm run db:seed` (or `npx prisma db seed`)

The user must have signed up (so their profile exists via trigger) before running seed to promote them.

---

## Admin Role Architecture

- **`proxy.ts`** protects `/admin` routes (requires login, not role check)
- **`app/[locale]/admin/layout.tsx`** performs the ADMIN role gate via Prisma query
- Non-admin users are redirected to `/` by the layout
- Admin role is stored in `profiles.role` column (enum: `USER` | `ADMIN`)

---

## Do NOT

- Write raw SQL with snake_case column names — columns are camelCase
- Use `prisma migrate dev` on Supabase — use `prisma db push`
- Forget to apply trigger SQL after `prisma db push`
- Assume profiles exist for all auth.users — check and backfill if needed
- Use string interpolation in raw SQL — always use parameterized queries
