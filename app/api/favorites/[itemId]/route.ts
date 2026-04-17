import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
	params: Promise<{ itemId: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
	const { itemId } = await params;

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Verify item exists
	const item = await prisma.item.findUnique({ where: { id: itemId } });
	if (!item) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	const favorite = await prisma.favorite.upsert({
		where: {
			profileId_itemId: {
				profileId: user.id,
				itemId,
			},
		},
		update: {},
		create: {
			profileId: user.id,
			itemId,
		},
	});

	return NextResponse.json(favorite, { status: 201 });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
	const { itemId } = await params;

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	await prisma.favorite.deleteMany({
		where: {
			profileId: user.id,
			itemId,
		},
	});

	return NextResponse.json({ success: true });
}
