import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(
	request: NextRequest,
	response?: NextResponse,
) {
	let supabaseResponse = response ?? NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					// Only create a fresh NextResponse.next if no response was provided
					if (!response) {
						supabaseResponse = NextResponse.next({ request });
					}
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	// Refresh the session — this is required so the user stays logged in
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Strip locale prefix (e.g. /id/dashboard → /dashboard) for route matching
	const pathname = request.nextUrl.pathname;
	const pathnameWithoutLocale =
		pathname.replace(/^\/(en|id)(?=\/|$)/, '') || '/';

	// Protected routes: redirect to landing page if not authenticated
	const protectedPaths = ['/dashboard', '/items/new', '/chat'];
	const isProtected = protectedPaths.some((path) =>
		pathnameWithoutLocale.startsWith(path),
	);

	if (isProtected && !user) {
		const url = request.nextUrl.clone();
		url.pathname = '/';
		url.searchParams.set('redirectTo', pathname);
		return NextResponse.redirect(url);
	}

	// If authenticated user is on a page with a redirectTo param, send them there
	const redirectTo = request.nextUrl.searchParams.get('redirectTo');
	if (user && redirectTo?.startsWith('/')) {
		const url = request.nextUrl.clone();
		url.pathname = redirectTo;
		url.searchParams.delete('redirectTo');
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}
