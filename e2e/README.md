# E2E Tests (Playwright)

## Scope

This suite covers high-value auth regression paths:

- Admin login redirects to `/admin`
- Regular user login does not redirect to `/admin`
- Protected route redirect (`/dashboard`) round-trips through `redirectTo` after login
- Logout does not append `?redirectTo=` query

## Reusable auth fixture

Use `e2e/fixtures/auth.ts` for worker-scoped seeded sessions:

- `adminPage`
- `userPage`
- `adminCredential`
- `userCredential`

This avoids repeated full login flows in every test and speeds up future suites.

## Required environment variables

Set these before running tests:

- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`

Optional:

- `E2E_BASE_URL` (defaults to `http://127.0.0.1:3000`)

If `E2E_BASE_URL` is not set, Playwright starts `npm run dev` automatically.

## Commands

- `npm run test:e2e`
- `npm run test:e2e:ui`
- `npm run test:e2e:headed`
- `npm run test:e2e:report`
