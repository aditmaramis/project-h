import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link, redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageComposer } from '@/components/chat/message-composer';

type Props = {
	params: Promise<{ locale: string; conversationId: string }>;
};

export default async function ConversationPage({ params }: Props) {
	const { locale, conversationId } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('Chat');

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect({ href: '/', locale });
		return null;
	}

	const conversation = await prisma.conversation.findFirst({
		where: {
			id: conversationId,
			participants: {
				some: { profileId: user.id },
			},
		},
		include: {
			item: { select: { title: true } },
			participants: {
				include: {
					profile: { select: { id: true, name: true } },
				},
			},
			messages: {
				orderBy: { createdAt: 'asc' },
				include: {
					sender: { select: { id: true, name: true } },
				},
			},
		},
	});

	if (!conversation) {
		notFound();
	}

	await prisma.message.updateMany({
		where: {
			conversationId,
			senderId: { not: user.id },
			readAt: null,
		},
		data: {
			readAt: new Date(),
		},
	});

	const otherParticipant =
		conversation.participants.find((p) => p.profile.id !== user.id)?.profile ??
		null;

	return (
		<div className="container mx-auto grid h-full gap-4 px-4 py-8">
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-sm text-muted-foreground">
						<Link
							href="/chat"
							className="hover:underline"
						>
							{t('backToMessages')}
						</Link>
					</p>
					<h1 className="text-xl font-semibold">{conversation.item.title}</h1>
					<p className="text-sm text-muted-foreground">
						{otherParticipant?.name ?? t('unknownUser')}
					</p>
				</div>
			</div>

			<Card className="flex min-h-105 flex-col">
				<CardHeader>
					<CardTitle>{t('conversation')}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-1 flex-col gap-3">
					<div className="grid max-h-105 gap-2 overflow-y-auto pr-1">
						{conversation.messages.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								{t('noMessagesYet')}
							</p>
						) : (
							conversation.messages.map((message) => {
								const isMine = message.senderId === user.id;
								return (
									<div
										key={message.id}
										className={
											isMine ? 'justify-self-end' : 'justify-self-start'
										}
									>
										<div className="max-w-[70ch] rounded-lg border bg-background px-3 py-2 text-sm">
											<p className="mb-1 text-xs text-muted-foreground">
												{message.sender.name ?? t('unknownUser')}
											</p>
											<p>{message.content}</p>
										</div>
									</div>
								);
							})
						)}
					</div>

					<MessageComposer conversationId={conversation.id} />
				</CardContent>
			</Card>
		</div>
	);
}
