import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
	if (process.env.NODE_ENV === 'production') {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signOut({ scope: 'local' });

	if (error) {
		return NextResponse.json({ error: 'Unable to sign out' }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}
