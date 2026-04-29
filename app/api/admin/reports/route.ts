import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

const reportStatuses = new Set(['PENDING', 'REVIEWED', 'DISMISSED']);

export async function GET(request: Request) {
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

	const { searchParams } = new URL(request.url);
	const statusParam = searchParams.get('status')?.toUpperCase();
	const status =
		statusParam && reportStatuses.has(statusParam) ? statusParam : undefined;

	const where = status ? { status } : undefined;

	const [reports, counts] = await Promise.all([
		prisma.report.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			include: {
				reporter: {
					select: { id: true, name: true, email: true, avatarUrl: true },
				},
				resolvedBy: {
					select: { id: true, name: true, email: true, avatarUrl: true },
				},
			},
		}),
		prisma.report.groupBy({
			by: ['status'],
			_count: { status: true },
		}),
	]);

	return NextResponse.json({
		reports,
		counts: counts.map((entry) => ({
			status: entry.status,
			count: entry._count.status,
		})),
	});
}
