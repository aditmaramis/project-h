import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
	createConversationSchema,
	sendMessageSchema,
} from '@/lib/validators/messages';

export async function GET() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const conversations = await prisma.conversation.findMany({
		where: {
			participants: {
				some: { profileId: user.id },
			},
		},
		include: {
			item: { select: { id: true, title: true, images: true } },
			participants: {
				include: {
					profile: { select: { id: true, name: true, avatarUrl: true } },
				},
			},
			messages: {
				orderBy: { createdAt: 'desc' },
				take: 1,
			},
		},
		orderBy: { createdAt: 'desc' },
	});

	const unreadGrouped = await prisma.message.groupBy({
		by: ['conversationId'],
		where: {
			readAt: null,
			NOT: { senderId: user.id },
			conversation: {
				participants: {
					some: { profileId: user.id },
				},
			},
		},
		_count: {
			_all: true,
		},
	});

	const unreadByConversation = new Map(
		unreadGrouped.map((row) => [row.conversationId, row._count._all]),
	);

	const conversationsWithUnread = conversations.map((conversation) => ({
		...conversation,
		unreadCount: unreadByConversation.get(conversation.id) ?? 0,
	}));

	return NextResponse.json(conversationsWithUnread);
}

export async function POST(request: Request) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();

	// If this is a new conversation
	if (body.itemId && body.participantId) {
		const parsed = createConversationSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.flatten() },
				{ status: 400 },
			);
		}

		// Check if conversation already exists between these users for this item
		const existing = await prisma.conversation.findFirst({
			where: {
				itemId: parsed.data.itemId,
				AND: [
					{ participants: { some: { profileId: user.id } } },
					{ participants: { some: { profileId: parsed.data.participantId } } },
				],
			},
		});

		if (existing) {
			return NextResponse.json(existing);
		}

		const conversation = await prisma.conversation.create({
			data: {
				itemId: parsed.data.itemId,
				participants: {
					create: [
						{ profileId: user.id },
						{ profileId: parsed.data.participantId },
					],
				},
			},
			include: {
				participants: true,
			},
		});

		return NextResponse.json(conversation, { status: 201 });
	}

	// If this is a new message
	const parsed = sendMessageSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	// Verify user is a participant of this conversation
	const participant = await prisma.conversationParticipant.findUnique({
		where: {
			conversationId_profileId: {
				conversationId: parsed.data.conversationId,
				profileId: user.id,
			},
		},
	});

	if (!participant) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const message = await prisma.message.create({
		data: {
			conversationId: parsed.data.conversationId,
			senderId: user.id,
			content: parsed.data.content,
		},
		include: {
			sender: { select: { id: true, name: true, avatarUrl: true } },
		},
	});

	return NextResponse.json(message, { status: 201 });
}
