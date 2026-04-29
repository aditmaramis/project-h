import { NextResponse } from 'next/server';
import type { Prisma } from '@/lib/generated/prisma/client';
import { generateUniqueItemSlug } from '@/lib/item-slug';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
	deleteAdminItemSchema,
	updateAdminItemSchema,
} from '@/lib/validators/admin';

type RouteContext = {
	params: Promise<{ id: string }>;
};

const itemSummarySelect = {
	id: true,
	title: true,
	slug: true,
	description: true,
	condition: true,
	status: true,
	categoryId: true,
	donorId: true,
	images: true,
	createdAt: true,
	updatedAt: true,
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
} as const;

async function assertAdmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return {
			error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
		};
	}

	const profile = await prisma.profile.findUnique({
		where: { id: user.id },
		select: { role: true },
	});

	if (!profile || profile.role !== 'ADMIN') {
		return {
			error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
		};
	}

	return { adminId: user.id };
}

export async function GET(_: Request, { params }: RouteContext) {
	const { id } = await params;
	const auth = await assertAdmin();

	if (auth.error) {
		return auth.error;
	}

	const item = await prisma.item.findUnique({
		where: { id },
		select: {
			...itemSummarySelect,
			_count: {
				select: {
					conversations: true,
					favorites: true,
				},
			},
		},
	});

	if (!item) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	const [reportsCount, recentActions] = await Promise.all([
		prisma.report.count({
			where: {
				targetType: 'ITEM',
				targetId: id,
			},
		}),
		prisma.adminAction.findMany({
			where: {
				targetType: 'ITEM',
				targetId: id,
			},
			orderBy: { createdAt: 'desc' },
			take: 5,
			include: {
				admin: {
					select: {
						id: true,
						name: true,
						avatarUrl: true,
					},
				},
			},
		}),
	]);

	return NextResponse.json({
		item,
		stats: {
			conversations: item._count.conversations,
			favorites: item._count.favorites,
			reports: reportsCount,
		},
		recentActions,
	});
}

export async function PATCH(request: Request, { params }: RouteContext) {
	const { id } = await params;
	const auth = await assertAdmin();

	if (auth.error) {
		return auth.error;
	}

	const body = await request.json();
	const parsed = updateAdminItemSchema.safeParse({
		itemId: id,
		title: body?.title,
		description: body?.description,
		condition: body?.condition,
		status: body?.status,
		categoryId: body?.categoryId,
		reason: body?.reason,
	});

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const currentItem = await prisma.item.findUnique({
		where: { id: parsed.data.itemId },
		select: itemSummarySelect,
	});

	if (!currentItem) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	if (
		parsed.data.categoryId &&
		parsed.data.categoryId !== currentItem.categoryId
	) {
		const category = await prisma.category.findUnique({
			where: { id: parsed.data.categoryId },
			select: { id: true },
		});

		if (!category) {
			return NextResponse.json(
				{ error: 'Category does not exist' },
				{ status: 400 },
			);
		}
	}

	const updateData: Prisma.ItemUpdateInput = {};
	const changedFields: Record<string, { before: unknown; after: unknown }> = {};

	if (
		parsed.data.title !== undefined &&
		parsed.data.title !== currentItem.title
	) {
		updateData.title = parsed.data.title;
		changedFields.title = {
			before: currentItem.title,
			after: parsed.data.title,
		};
	}

	if (
		parsed.data.description !== undefined &&
		parsed.data.description !== currentItem.description
	) {
		updateData.description = parsed.data.description;
		changedFields.description = {
			before: currentItem.description,
			after: parsed.data.description,
		};
	}

	if (
		parsed.data.condition !== undefined &&
		parsed.data.condition !== currentItem.condition
	) {
		updateData.condition = parsed.data.condition;
		changedFields.condition = {
			before: currentItem.condition,
			after: parsed.data.condition,
		};
	}

	if (
		parsed.data.status !== undefined &&
		parsed.data.status !== currentItem.status
	) {
		updateData.status = parsed.data.status;
		changedFields.status = {
			before: currentItem.status,
			after: parsed.data.status,
		};
	}

	if (
		parsed.data.categoryId !== undefined &&
		parsed.data.categoryId !== currentItem.categoryId
	) {
		updateData.categoryId = parsed.data.categoryId;
		changedFields.categoryId = {
			before: currentItem.categoryId,
			after: parsed.data.categoryId,
		};
	}

	const nextTitle = parsed.data.title ?? currentItem.title;
	const nextCategoryId = parsed.data.categoryId ?? currentItem.categoryId;
	const shouldRegenerateSlug =
		nextTitle !== currentItem.title ||
		nextCategoryId !== currentItem.categoryId ||
		!currentItem.slug;

	if (shouldRegenerateSlug) {
		const nextSlug = await generateUniqueItemSlug({
			title: nextTitle,
			categoryId: nextCategoryId,
			excludeItemId: currentItem.id,
		});

		if (nextSlug !== currentItem.slug) {
			updateData.slug = nextSlug;
			changedFields.slug = {
				before: currentItem.slug,
				after: nextSlug,
			};
		}
	}

	if (Object.keys(changedFields).length === 0) {
		return NextResponse.json({ ...currentItem, unchanged: true });
	}

	const reason = parsed.data.reason?.trim() || null;
	const [updatedItem] = await prisma.$transaction([
		prisma.item.update({
			where: { id: parsed.data.itemId },
			data: updateData,
			select: itemSummarySelect,
		}),
		prisma.adminAction.create({
			data: {
				adminId: auth.adminId,
				actionType: 'EDIT_ITEM',
				targetType: 'ITEM',
				targetId: parsed.data.itemId,
				details: JSON.stringify({
					reason,
					changedFields,
				}),
			},
		}),
	]);

	return NextResponse.json(updatedItem);
}

export async function DELETE(request: Request, { params }: RouteContext) {
	const { id } = await params;
	const auth = await assertAdmin();

	if (auth.error) {
		return auth.error;
	}

	const rawBody = await request.text();
	let body: unknown = {};

	if (rawBody.trim().length > 0) {
		try {
			body = JSON.parse(rawBody);
		} catch {
			return NextResponse.json(
				{ error: 'Invalid JSON payload' },
				{ status: 400 },
			);
		}
	}

	const parsed = deleteAdminItemSchema.safeParse({
		itemId: id,
		reason: (body as { reason?: unknown }).reason,
	});

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const currentItem = await prisma.item.findUnique({
		where: { id: parsed.data.itemId },
		select: {
			id: true,
			title: true,
			status: true,
			condition: true,
			categoryId: true,
			donorId: true,
		},
	});

	if (!currentItem) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	await prisma.$transaction([
		prisma.item.delete({
			where: { id: parsed.data.itemId },
		}),
		prisma.adminAction.create({
			data: {
				adminId: auth.adminId,
				actionType: 'DELETE_ITEM',
				targetType: 'ITEM',
				targetId: parsed.data.itemId,
				details: JSON.stringify({
					reason: parsed.data.reason,
					deletedItem: currentItem,
				}),
			},
		}),
	]);

	return NextResponse.json({ success: true });
}
