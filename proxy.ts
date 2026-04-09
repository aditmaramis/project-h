import { type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from '@/lib/supabase/proxy';

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
	// Step 1: Handle i18n routing (locale detection, redirects, rewrites)
	const i18nResponse = handleI18nRouting(request);

	// Step 2: Run Supabase session management on the i18n response
	return await updateSession(request, i18nResponse);
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder assets (SVGs, images, etc.)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};
