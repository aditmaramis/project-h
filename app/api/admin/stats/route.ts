import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
	// Auth + admin role check
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

	// Date boundaries
	const now = new Date();
	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	);
	const startOfWeek = new Date(startOfToday);
	startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	// Run queries in parallel to avoid waterfall
	const [
		totalUsers,
		newUsersToday,
		newUsersThisWeek,
		newUsersThisMonth,
		totalItems,
		newItemsToday,
		newItemsThisWeek,
		newItemsThisMonth,
		itemsByStatusRaw,
		totalConversations,
		pendingReports,
		recentActionsCount,
		recentActions,
		signupsByDay,
		itemsByDay,
	] = await Promise.all([
		prisma.profile.count(),
		prisma.profile.count({
			where: { createdAt: { gte: startOfToday } },
		}),
		prisma.profile.count({
			where: { createdAt: { gte: startOfWeek } },
		}),
		prisma.profile.count({
			where: { createdAt: { gte: startOfMonth } },
		}),
		prisma.item.count(),
		prisma.item.count({
			where: { createdAt: { gte: startOfToday } },
		}),
		prisma.item.count({
			where: { createdAt: { gte: startOfWeek } },
		}),
		prisma.item.count({
			where: { createdAt: { gte: startOfMonth } },
		}),
		prisma.item.groupBy({
			by: ['status'],
			_count: { status: true },
		}),
		prisma.conversation.count(),
		prisma.report.count({
			where: { status: 'PENDING' },
		}),
		prisma.adminAction.count({
			where: { createdAt: { gte: startOfWeek } },
		}),
		prisma.adminAction.findMany({
			take: 10,
			orderBy: { createdAt: 'desc' },
			include: {
				admin: { select: { id: true, name: true, avatarUrl: true } },
			},
		}),
		// Signups per day for the last 30 days (raw SQL for date grouping)
		prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
			`SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
			 FROM profiles
			 WHERE "createdAt" >= $1
			 GROUP BY DATE("createdAt")
			 ORDER BY date ASC`,
			new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
		),
		// Items per day for the last 30 days
		prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
			`SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
			 FROM items
			 WHERE "createdAt" >= $1
			 GROUP BY DATE("createdAt")
			 ORDER BY date ASC`,
			new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
		),
	]);

	const itemsByStatus = itemsByStatusRaw.map((item) => ({
		status: item.status,
		count: item._count.status,
	}));

	// Convert BigInt to number for JSON serialization
	const signupsTimeline = signupsByDay.map((row) => ({
		date: String(row.date),
		count: Number(row.count),
	}));

	const itemsTimeline = itemsByDay.map((row) => ({
		date: String(row.date),
		count: Number(row.count),
	}));

	return NextResponse.json({
		totalUsers,
		newUsersToday,
		newUsersThisWeek,
		newUsersThisMonth,
		totalItems,
		newItemsToday,
		newItemsThisWeek,
		newItemsThisMonth,
		itemsByStatus,
		totalConversations,
		pendingReports,
		recentActionsCount,
		recentActions,
		signupsTimeline,
		itemsTimeline,
	});
}
