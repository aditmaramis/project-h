import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect, Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Props = {
	params: Promise<{ locale: string }>;
};

export default async function ChatListPage({ params }: Props) {
	const { locale } = await params;
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

	const conversations = await prisma.conversation.findMany({
		where: {
			participants: {
				some: { profileId: user.id },
			},
		},
		include: {
			item: {
				select: { id: true, title: true, images: true },
			},
			participants: {
				include: {
					profile: { select: { id: true, name: true } },
				},
			},
			messages: {
				orderBy: { createdAt: 'desc' },
				take: 1,
			},
		},
		orderBy: { createdAt: 'desc' },
	});

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">{t('messages')}</h1>

			{conversations.length === 0 ? (
				<Card>
					<CardContent className="py-10 text-center text-muted-foreground">
						{t('noConversations')}
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					{conversations.map((conversation) => {
						const otherParticipant =
							conversation.participants.find((p) => p.profile.id !== user.id)
								?.profile ?? null;
						const otherName = otherParticipant?.name ?? t('unknownUser');
						const lastMessage = conversation.messages[0]?.content;

						return (
							<Card key={conversation.id}>
								<CardHeader className="pb-2">
									<CardTitle className="text-base">
										<Link
											href={`/chat/${conversation.id}`}
											className="hover:underline"
										>
											{conversation.item.title}
										</Link>
									</CardTitle>
								</CardHeader>
								<CardContent className="grid gap-2 pt-0">
									<div className="flex items-center gap-2">
										<Badge variant="outline">{otherName}</Badge>
									</div>
									<p className="text-sm text-muted-foreground">
										{lastMessage || t('noMessagesYet')}
									</p>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
