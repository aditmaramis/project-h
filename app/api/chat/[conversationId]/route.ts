import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
	params: Promise<{ conversationId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
	const { conversationId } = await params;

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const conversation = await prisma.conversation.findFirst({
		where: {
			id: conversationId,
			participants: {
				some: { profileId: user.id },
			},
		},
		include: {
			item: { select: { id: true, title: true } },
			participants: {
				include: {
					profile: {
						select: { id: true, name: true, avatarUrl: true },
					},
				},
			},
			messages: {
				orderBy: { createdAt: 'asc' },
				include: {
					sender: {
						select: { id: true, name: true, avatarUrl: true },
					},
				},
			},
		},
	});

	if (!conversation) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	return NextResponse.json(conversation);
}

export async function PATCH(_request: Request, { params }: RouteContext) {
	const { conversationId } = await params;

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const participant = await prisma.conversationParticipant.findUnique({
		where: {
			conversationId_profileId: {
				conversationId,
				profileId: user.id,
			},
		},
	});

	if (!participant) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const updated = await prisma.message.updateMany({
		where: {
			conversationId,
			senderId: { not: user.id },
			readAt: null,
		},
		data: {
			readAt: new Date(),
		},
	});

	return NextResponse.json({ readCount: updated.count });
}
