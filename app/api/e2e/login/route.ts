import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validators/auth';

export async function POST(request: Request) {
	if (process.env.NODE_ENV === 'production') {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	const body = await request.json();
	const parsed = loginSchema.safeParse({
		email: body?.email,
		password: body?.password,
	});

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const supabase = await createClient();
	const { data, error } = await supabase.auth.signInWithPassword({
		email: parsed.data.email,
		password: parsed.data.password,
	});

	if (error || !data.user) {
		return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
	}

	return NextResponse.json({ userId: data.user.id });
}
