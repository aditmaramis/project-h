import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { resolveReportSchema } from '@/lib/validators/admin';

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
	const { id } = await params;

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const profile = await prisma.profile.findUnique({
		where: { id: user.id },
		select: { role: true },
	});

	if (!profile || profile.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json();
	const parsed = resolveReportSchema.safeParse({
		reportId: id,
		status: body?.status,
		adminNote: body?.adminNote,
	});

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const trimmedNote = parsed.data.adminNote?.trim();
	if (parsed.data.status === 'DISMISSED' && !trimmedNote) {
		return NextResponse.json(
			{ error: 'Dismiss reason required' },
			{ status: 400 },
		);
	}

	const currentReport = await prisma.report.findUnique({
		where: { id: parsed.data.reportId },
		select: { id: true, status: true },
	});

	if (!currentReport) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	if (currentReport.status !== 'PENDING') {
		return NextResponse.json({ error: 'Conflict' }, { status: 409 });
	}

	const actionType =
		parsed.data.status === 'REVIEWED' ? 'RESOLVE_REPORT' : 'DISMISS_REPORT';

	const [updatedReport] = await prisma.$transaction([
		prisma.report.update({
			where: { id: parsed.data.reportId },
			data: {
				status: parsed.data.status,
				adminNote: trimmedNote ?? null,
				resolvedById: user.id,
				resolvedAt: new Date(),
			},
		}),
		prisma.adminAction.create({
			data: {
				adminId: user.id,
				actionType,
				targetType: 'REPORT',
				targetId: parsed.data.reportId,
				details: JSON.stringify({
					status: parsed.data.status,
					adminNote: trimmedNote ?? null,
				}),
			},
		}),
	]);

	return NextResponse.json(updatedReport);
}
