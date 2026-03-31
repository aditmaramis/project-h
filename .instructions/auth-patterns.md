---
applyTo: '**'
---

# Auth Patterns

All authentication in Hibah is handled exclusively by **Supabase Auth**. No other auth provider, library, or custom auth flow may be introduced.

---

## Supabase-Only Rule

- **Never** add alternative auth libraries (NextAuth, Clerk, Auth0, Lucia, etc.)
- **Never** implement custom JWT/session management outside Supabase
- All auth state flows through Supabase's cookie-based session via `@supabase/ssr`

## Supabase Client Usage

| Context             | Import                  | Notes                    |
| ------------------- | ----------------------- | ------------------------ |
| Client components   | `@/lib/supabase/client` | `createClient()` (sync)  |
| Server / API routes | `@/lib/supabase/server` | `await createClient()`   |
| Proxy (middleware)  | `@/lib/supabase/proxy`  | `updateSession(request)` |

## Sign In / Sign Up Must Be Modals

- Login and signup flows **must always render as modals** (dialog overlays), not as standalone pages.
- There are **no** standalone `/login` or `/signup` pages — the `(auth)` route group has been removed.
- Use a shared `AuthModal` client component wrapping shadcn `Dialog` for both sign-in and sign-up forms.
- Trigger the modal from header/nav buttons — never navigate away from the current page to show auth.

```tsx
// Example: opening auth modal from a button
<AuthModal
	mode="login"
	trigger={<Button variant="outline">Log in</Button>}
/>
```

## Protected Routes

The following paths require an authenticated user:

- `/dashboard` and all sub-routes (`/dashboard/**`)
- `/chat` and all sub-routes (`/chat/**`)
- `/dashboard/items/new`, `/dashboard/items/[id]/edit`

Protection is enforced in `proxy.ts` → `updateSession()`:

```ts
const protectedPaths = ['/dashboard', '/items/new', '/chat'];
const isProtected = protectedPaths.some((path) =>
	request.nextUrl.pathname.startsWith(path),
);
if (isProtected && !user) {
	// Redirect to landing page with redirectTo param
}
```

- Unauthenticated users hitting a protected route are redirected to `/` (landing page) with `?redirectTo=<original_path>`.
- After successful auth (via modal), redirect the user back to the `redirectTo` path.

## Auth Check in API Routes (Required)

Every API route that requires auth must verify the user server-side:

```ts
const supabase = await createClient();
const {
	data: { user },
} = await supabase.auth.getUser();
if (!user) {
	return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

- **Never** trust client-supplied user IDs — always derive from `user.id`.
- **Never** skip this check on mutation endpoints.

## OAuth Callback

The callback route at `app/auth/callback/route.ts` exchanges the auth code for a session. It redirects to the `next` query param on success, or `/?error=auth-code-error` on failure.

## Session Refresh

`proxy.ts` calls `supabase.auth.getUser()` on every matched request to keep the session cookie fresh. Do not remove or bypass this.

## Logged-In User Redirects

- Since there are no standalone `/login` or `/signup` pages, no redirect logic is needed for those paths.
- Auth is handled entirely via the `AuthModal` component in the header.
