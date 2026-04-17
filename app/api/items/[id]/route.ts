import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { updateItemSchema } from '@/lib/validators/items';

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
	const { id } = await params;

	const item = await prisma.item.findUnique({
		where: { id },
		include: {
			category: true,
			donor: { select: { id: true, name: true, avatarUrl: true } },
		},
	});

	if (!item) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	return NextResponse.json(item);
}

export async function PATCH(request: Request, { params }: RouteContext) {
	const { id } = await params;

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const item = await prisma.item.findUnique({ where: { id } });
	if (!item) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}
	if (item.donorId !== user.id) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json();
	const parsed = updateItemSchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const updated = await prisma.item.update({
		where: { id },
		data: parsed.data,
		include: { category: true },
	});

	return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
	const { id } = await params;

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const item = await prisma.item.findUnique({ where: { id } });
	if (!item) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}
	if (item.donorId !== user.id) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	await prisma.item.delete({ where: { id } });

	return NextResponse.json({ success: true });
}
