# User Dashboard — Phased Plan

## Phase 1: Schema + Foundation ← START HERE

### Prisma Schema Changes

- Add `AccountType` enum: `PERSONAL`, `ORGANIZATION`
- Add `Favorite` model (profileId + itemId, unique constraint)
- Add to Profile: `accountType AccountType @default(PERSONAL)`, `isVerified Boolean @default(false)`, `verifiedAt DateTime?`, `favorites Favorite[]`
- Add to Item: `favorites Favorite[]`
- Update profile trigger SQL to include `"accountType"` column default
- Run `prisma db push` + `prisma generate`

### Signup Flow

- Add `accountType` to `signupSchema` validator
- Add account type selection (Personal / Organization) to signup form
- Pass `accountType` in Supabase `signUp` user metadata → trigger sets it on Profile

### Validators

- `lib/validators/profile.ts`: `updateProfileSchema` (name, bio, avatarUrl)

### Types

- Add `Favorite`, `AccountType` re-exports to `types/index.ts`
- Add `ItemWithFavorite` composite type

### i18n

- Add `Auth.accountType`, `Auth.personal`, `Auth.organization` keys
- Add `Dashboard` namespace (~30+ keys)

## Phase 2: Dashboard Layout + Main Page

### Layout (`app/[locale]/dashboard/layout.tsx`)

- Auth check (Supabase user → fetch profile)
- `SidebarProvider` + `DashboardSidebar` + `SidebarInset` (mirror admin layout)
- Pass profile data to sidebar via props or context

### Dashboard Sidebar (`components/dashboard/sidebar.tsx`)

- User avatar + name in header
- Nav items: Overview, My Items, Favorites, Messages, Settings
- Links: `/dashboard`, `/dashboard/items`, `/dashboard/favorites`, `/chat`, `/dashboard/settings`
- Active state based on pathname

### Main Page (`app/[locale]/dashboard/page.tsx`)

- Greeting: "Good morning/afternoon/evening, {name}!" (time-based)
- Quick stats cards: total items posted, active items, total donated, active conversations
- User's items list (recent 5, link to full list)
- Each item card: thumbnail, title, status badge, date, actions (edit/delete)

## Phase 3: Profile Settings

Page: `app/[locale]/dashboard/settings/page.tsx`

- Profile edit form (name, bio)
- Account type display (non-editable after signup, or changeable?)
- Avatar upload via Supabase Storage (`avatars` bucket)
  - Client-side: file picker → upload to Supabase Storage → get public URL → PATCH profile
- Organization badge display (if org + verified)
- API: existing `PATCH /api/profile` already supports name/bio/avatarUrl

## Phase 4: Item Management

### Item Form Component (`components/dashboard/item-form.tsx`)

- Shared form for create + edit
- Fields: title, description, condition (select), category (select), images (upload), location (map picker)
- Image upload: Supabase Storage `items` bucket, up to 5 images
- Location: reuse existing `LocationPicker` component
- Zod validation with `createItemSchema` / `updateItemSchema`

### Create Page (`app/[locale]/dashboard/items/new/page.tsx`)

- Server component wrapping `ItemForm` client component
- Fetch categories server-side, pass to form
- POST to `/api/items`

### Edit Page (`app/[locale]/dashboard/items/[id]/edit/page.tsx`)

- Fetch item + categories server-side
- Verify ownership (donorId === user.id)
- Pre-fill form with existing data
- PATCH to `/api/items/[id]`

### My Items Page (`app/[locale]/dashboard/items/page.tsx`)

- Full paginated list of user's items
- Filter by status (All / Available / Reserved / Donated)
- Each row: thumbnail, title, status badge, date, conversation count
- Actions: edit, delete, mark as donated

### Mark as Donated Flow

- Dialog triggered from item actions
- Fetch conversations for that item
- Show list of conversation participants (potential recipients)
- User selects recipient → PATCH item status to DONATED
- Optional: record recipient in item or create a donation record

### API Routes

- `app/api/items/[id]/route.ts`: GET (single item), PATCH (update), DELETE
- Items GET already exists, POST already exists

## Phase 5: Favorites

### Favorite Model API

- `app/api/favorites/route.ts`: GET (user's favorites), POST (add favorite)
- `app/api/favorites/[itemId]/route.ts`: DELETE (remove favorite)

### Favorites Page (`app/[locale]/dashboard/favorites/page.tsx`)

- Grid of favorited items (reuse item card component)
- Unfavorite button on each card

### Public Item Integration

- Add heart/save button to item cards on browse page and item detail
- Toggle favorite via API
- Show filled heart if already favorited (check against user's favorites)

## Technical Notes

- Dashboard layout mirrors admin: `SidebarProvider` + custom sidebar + `SidebarInset`
- All dashboard pages are SSR with direct Prisma queries where possible
- Client components only for: forms, toggles, image upload, map picker
- Every API mutation verifies auth via Supabase `getUser()`
- Image uploads go to Supabase Storage; URLs stored in Prisma
- Supabase Storage buckets needed: `avatars` (public), `items` (public)
- Profile trigger SQL must be updated to handle `accountType` from user metadata
- Organizations start unverified; admin verification is part of Admin Phase 2
