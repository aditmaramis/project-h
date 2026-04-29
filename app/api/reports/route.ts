import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { createReportSchema } from '@/lib/validators/reports';

export async function POST(request: Request) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const parsed = createReportSchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const item = await prisma.item.findUnique({
		where: { id: parsed.data.targetId },
		select: { donorId: true },
	});

	if (!item) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	if (item.donorId === user.id) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const existingReport = await prisma.report.findFirst({
		where: {
			reporterId: user.id,
			targetType: 'ITEM',
			targetId: parsed.data.targetId,
			status: 'PENDING',
		},
		select: { id: true },
	});

	if (existingReport) {
		return NextResponse.json({ error: 'Conflict' }, { status: 409 });
	}

	const report = await prisma.report.create({
		data: {
			reporterId: user.id,
			targetType: 'ITEM',
			targetId: parsed.data.targetId,
			reason: parsed.data.reason,
		},
	});

	return NextResponse.json(report, { status: 201 });
}
