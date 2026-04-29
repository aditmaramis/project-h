import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { updateAdminUserSchema } from '@/lib/validators/admin';

type RouteContext = {
	params: Promise<{ id: string }>;
};

const userSummarySelect = {
	id: true,
	name: true,
	email: true,
	avatarUrl: true,
	role: true,
	isBanned: true,
	bannedAt: true,
	bannedReason: true,
	createdAt: true,
	updatedAt: true,
	accountType: true,
	isVerified: true,
} as const;

export async function GET(_: Request, { params }: RouteContext) {
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

	const targetUser = await prisma.profile.findUnique({
		where: { id },
		select: {
			...userSummarySelect,
			bio: true,
			district: true,
			region: true,
			country: true,
			verifiedAt: true,
		},
	});

	if (!targetUser) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	const [
		totalItems,
		activeItems,
		reservedItems,
		donatedItems,
		reportsSubmitted,
		conversationCount,
		recentActions,
	] = await Promise.all([
		prisma.item.count({ where: { donorId: id } }),
		prisma.item.count({ where: { donorId: id, status: 'AVAILABLE' } }),
		prisma.item.count({ where: { donorId: id, status: 'RESERVED' } }),
		prisma.item.count({ where: { donorId: id, status: 'DONATED' } }),
		prisma.report.count({ where: { reporterId: id } }),
		prisma.conversationParticipant.count({ where: { profileId: id } }),
		prisma.adminAction.findMany({
			where: { targetType: 'PROFILE', targetId: id },
			orderBy: { createdAt: 'desc' },
			take: 5,
			include: {
				admin: {
					select: { id: true, name: true, avatarUrl: true },
				},
			},
		}),
	]);

	return NextResponse.json({
		user: targetUser,
		stats: {
			totalItems,
			activeItems,
			reservedItems,
			donatedItems,
			reportsSubmitted,
			conversationCount,
		},
		recentActions,
	});
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

	const profile = await prisma.profile.findUnique({
		where: { id: user.id },
		select: { role: true },
	});

	if (!profile || profile.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json();
	const parsed = updateAdminUserSchema.safeParse({
		userId: id,
		action: body?.action,
		reason: body?.reason,
		role: body?.role,
	});

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const targetUser = await prisma.profile.findUnique({
		where: { id: parsed.data.userId },
		select: userSummarySelect,
	});

	if (!targetUser) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	if (parsed.data.action === 'BAN' && parsed.data.userId === user.id) {
		return NextResponse.json(
			{ error: 'Cannot ban your own account' },
			{ status: 400 },
		);
	}

	if (
		parsed.data.action === 'SET_ROLE' &&
		parsed.data.userId === user.id &&
		parsed.data.role === 'USER'
	) {
		return NextResponse.json(
			{ error: 'Cannot demote your own account' },
			{ status: 400 },
		);
	}

	if (parsed.data.action === 'BAN') {
		const reason = parsed.data.reason.trim();
		const [updatedUser] = await prisma.$transaction([
			prisma.profile.update({
				where: { id: parsed.data.userId },
				data: {
					isBanned: true,
					bannedAt: new Date(),
					bannedReason: reason,
				},
				select: userSummarySelect,
			}),
			prisma.adminAction.create({
				data: {
					adminId: user.id,
					actionType: 'BAN_USER',
					targetType: 'PROFILE',
					targetId: parsed.data.userId,
					details: JSON.stringify({
						reason,
						wasBanned: targetUser.isBanned,
					}),
				},
			}),
		]);

		return NextResponse.json(updatedUser);
	}

	if (parsed.data.action === 'UNBAN') {
		const [updatedUser] = await prisma.$transaction([
			prisma.profile.update({
				where: { id: parsed.data.userId },
				data: {
					isBanned: false,
					bannedAt: null,
					bannedReason: null,
				},
				select: userSummarySelect,
			}),
			prisma.adminAction.create({
				data: {
					adminId: user.id,
					actionType: 'UNBAN_USER',
					targetType: 'PROFILE',
					targetId: parsed.data.userId,
					details: JSON.stringify({
						wasBanned: targetUser.isBanned,
					}),
				},
			}),
		]);

		return NextResponse.json(updatedUser);
	}

	if (parsed.data.action === 'WARN') {
		const reason = parsed.data.reason.trim();
		await prisma.adminAction.create({
			data: {
				adminId: user.id,
				actionType: 'WARN_USER',
				targetType: 'PROFILE',
				targetId: parsed.data.userId,
				details: JSON.stringify({
					kind: 'WARNING',
					reason,
				}),
			},
		});

		return NextResponse.json(targetUser);
	}

	if (targetUser.role === parsed.data.role) {
		return NextResponse.json({ ...targetUser, unchanged: true });
	}

	const roleActionType =
		parsed.data.role === 'ADMIN' ? 'PROMOTE_USER' : 'DEMOTE_USER';

	const [updatedUser] = await prisma.$transaction([
		prisma.profile.update({
			where: { id: parsed.data.userId },
			data: {
				role: parsed.data.role,
			},
			select: userSummarySelect,
		}),
		prisma.adminAction.create({
			data: {
				adminId: user.id,
				actionType: roleActionType,
				targetType: 'PROFILE',
				targetId: parsed.data.userId,
				details: JSON.stringify({
					previousRole: targetUser.role,
					nextRole: parsed.data.role,
				}),
			},
		}),
	]);

	return NextResponse.json(updatedUser);
}
