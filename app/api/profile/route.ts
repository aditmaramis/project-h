import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const profile = await prisma.profile.findUnique({
		where: { id: user.id },
	});

	if (!profile) {
		return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
	}

	return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { name, bio, avatarUrl } = body;

	const profile = await prisma.profile.update({
		where: { id: user.id },
		data: {
			...(name !== undefined && { name }),
			...(bio !== undefined && { bio }),
			...(avatarUrl !== undefined && { avatarUrl }),
		},
	});

	return NextResponse.json(profile);
}
