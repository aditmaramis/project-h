---
description: Internationalization with next-intl, translation keys, locale routing
globs: **/*.{ts,tsx}
---

# Internationalization (i18n) Patterns

## Architecture

- **Library**: `next-intl` v4.x
- **Locales**: `en` (English, default), `id` (Bahasa Indonesia)
- **URL strategy**: `localePrefix: 'as-needed'` — English at `/`, Bahasa at `/id/…`
- **Config files**: `i18n/routing.ts`, `i18n/navigation.ts`, `i18n/request.ts`
- **Translations**: `messages/en.json`, `messages/id.json`

## Rules

1. **Never hardcode user-facing strings** — always use translation keys.
2. **Add keys to BOTH `en.json` and `id.json`** when creating new translations.
3. **Use `@/i18n/navigation`** instead of `next/link` or `next/navigation` for locale-aware routing:
   ```ts
   import { Link, useRouter, usePathname, redirect } from '@/i18n/navigation';
   ```
4. **Server Components**: Use `getTranslations('Namespace')` from `next-intl/server`.
5. **Client Components**: Use `useTranslations('Namespace')` from `next-intl`.
6. **Every layout under `app/[locale]/`** must call `setRequestLocale(locale)`:
   ```ts
   import { setRequestLocale } from 'next-intl/server';
   const { locale } = await params;
   setRequestLocale(locale);
   ```
7. **All page routes live under `app/[locale]/`** — only `api/` and `auth/callback` stay outside.

## Adding translations

1. Choose or create a namespace in `messages/en.json` and `messages/id.json`.
2. Add keys under the namespace in **both** files.
3. In server components: `const t = await getTranslations('MyNamespace');`
4. In client components: `const t = useTranslations('MyNamespace');`
5. Use `t('key')` for simple strings, `t('key', { param: value })` for interpolation.

## Proxy (middleware) composition

`proxy.ts` composes `next-intl` middleware first (locale detection + routing), then runs Supabase `updateSession` on the i18n response. Protected route matching strips the locale prefix before comparing paths.

## Translation namespaces

Current namespaces: `TopBar`, `Header`, `Search`, `Categories`, `Location`, `Auth`, `Footer`, `LanguageSwitcher`, `Metadata`.
