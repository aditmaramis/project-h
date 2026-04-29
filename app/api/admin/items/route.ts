import { NextResponse } from 'next/server';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { adminItemsQuerySchema } from '@/lib/validators/admin';

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
	const parsedQuery = adminItemsQuerySchema.safeParse({
		page: searchParams.get('page') ?? undefined,
		limit: searchParams.get('limit') ?? undefined,
		search: searchParams.get('search') ?? undefined,
		status: searchParams.get('status') ?? undefined,
		categoryId: searchParams.get('categoryId') ?? undefined,
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
	const baseWhere: Prisma.ItemWhereInput = {};

	if (query.search) {
		baseWhere.title = { contains: query.search, mode: 'insensitive' };
	}

	if (query.categoryId) {
		baseWhere.categoryId = query.categoryId;
	}

	const where: Prisma.ItemWhereInput = query.status
		? { ...baseWhere, status: query.status }
		: baseWhere;

	const orderBy: Prisma.ItemOrderByWithRelationInput[] =
		query.sortBy === 'title'
			? [{ title: query.sortOrder }, { createdAt: 'desc' }]
			: [{ createdAt: query.sortOrder }, { id: 'asc' }];

	const skip = (query.page - 1) * query.limit;

	const [items, totalItems, statusGroups] = await Promise.all([
		prisma.item.findMany({
			where,
			orderBy,
			skip,
			take: query.limit,
			select: {
				id: true,
				title: true,
				status: true,
				condition: true,
				createdAt: true,
				images: true,
				category: {
					select: {
						id: true,
						name: true,
						slug: true,
					},
				},
				donor: {
					select: {
						id: true,
						name: true,
						email: true,
						avatarUrl: true,
					},
				},
			},
		}),
		prisma.item.count({ where }),
		prisma.item.groupBy({
			by: ['status'],
			where: baseWhere,
			_count: { status: true },
		}),
	]);

	const statusCounts = {
		AVAILABLE: 0,
		RESERVED: 0,
		DONATED: 0,
	};

	for (const group of statusGroups) {
		statusCounts[group.status] = group._count.status;
	}

	const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));

	return NextResponse.json({
		items,
		pagination: {
			page: query.page,
			limit: query.limit,
			totalItems,
			totalPages,
			hasNextPage: query.page < totalPages,
			hasPreviousPage: query.page > 1,
		},
		filters: {
			search: query.search ?? '',
			status: query.status ?? 'ALL',
			categoryId: query.categoryId ?? 'ALL',
			sortBy: query.sortBy,
			sortOrder: query.sortOrder,
		},
		statusCounts,
	});
}
