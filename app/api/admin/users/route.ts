import { NextResponse } from 'next/server';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { adminUsersQuerySchema } from '@/lib/validators/admin';

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
	const parsedQuery = adminUsersQuerySchema.safeParse({
		page: searchParams.get('page') ?? undefined,
		limit: searchParams.get('limit') ?? undefined,
		search: searchParams.get('search') ?? undefined,
		role: searchParams.get('role') ?? undefined,
		banStatus: searchParams.get('banStatus') ?? undefined,
		sortBy: searchParams.get('sortBy') ?? undefined,
		sortOrder: searchParams.get('sortOrder') ?? undefined,
	});

	if (!parsedQuery.success) {
		return NextResponse.json(
			{ error: parsedQuery.error.flatten() },
			{ status: 400 },
		);
	}

	const query = parsedQuery.data;
	const where: Prisma.ProfileWhereInput = {};

	if (query.search) {
		where.OR = [
			{ name: { contains: query.search, mode: 'insensitive' } },
			{ email: { contains: query.search, mode: 'insensitive' } },
		];
	}

	if (query.role) {
		where.role = query.role;
	}

	if (query.banStatus === 'ACTIVE') {
		where.isBanned = false;
	}

	if (query.banStatus === 'BANNED') {
		where.isBanned = true;
	}

	const orderBy: Prisma.ProfileOrderByWithRelationInput[] =
		query.sortBy === 'name'
			? [{ name: query.sortOrder }, { createdAt: 'desc' }]
			: [{ createdAt: query.sortOrder }, { id: 'asc' }];

	const skip = (query.page - 1) * query.limit;

	const [users, totalUsers] = await Promise.all([
		prisma.profile.findMany({
			where,
			orderBy,
			skip,
			take: query.limit,
			select: {
				id: true,
				name: true,
				email: true,
				avatarUrl: true,
				role: true,
				isBanned: true,
				bannedAt: true,
				bannedReason: true,
				accountType: true,
				isVerified: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		prisma.profile.count({ where }),
	]);

	const totalPages = Math.max(1, Math.ceil(totalUsers / query.limit));

	return NextResponse.json({
		users,
		pagination: {
			page: query.page,
			limit: query.limit,
			totalUsers,
			totalPages,
			hasNextPage: query.page < totalPages,
			hasPreviousPage: query.page > 1,
		},
		filters: {
			search: query.search ?? '',
			role: query.role ?? 'ALL',
			banStatus: query.banStatus ?? 'ALL',
			sortBy: query.sortBy,
			sortOrder: query.sortOrder,
		},
	});
}
