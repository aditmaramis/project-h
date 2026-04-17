import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
	const { id } = await params;

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Verify ownership
	const item = await prisma.item.findUnique({ where: { id } });
	if (!item || item.donorId !== user.id) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	// Find conversations about this item, get other participants
	const conversations = await prisma.conversation.findMany({
		where: { itemId: id },
		include: {
			participants: {
				where: { profileId: { not: user.id } },
				include: {
					profile: { select: { id: true, name: true } },
				},
			},
		},
	});

	// Flatten to unique profiles
	const seen = new Set<string>();
	const recipients: { id: string; name: string | null }[] = [];

	for (const conv of conversations) {
		for (const p of conv.participants) {
			if (!seen.has(p.profile.id)) {
				seen.add(p.profile.id);
				recipients.push({ id: p.profile.id, name: p.profile.name });
			}
		}
	}

	return NextResponse.json(recipients);
}
