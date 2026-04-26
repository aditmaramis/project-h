import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { FavoriteButton } from '@/components/dashboard/favorite-button';
import { StartConversationButton } from '@/components/chat/start-conversation-button';
import { ItemImageGallery } from '@/components/items/item-image-gallery';
import { buildProfileHref } from '@/lib/profile-url';

type Props = {
	params: Promise<{ locale: string; id: string }>;
};

export default async function ItemDetailPage({ params }: Props) {
	const { locale, id } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('Items');

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const item = await prisma.item.findUnique({
		where: { id },
		include: {
			category: { select: { name: true } },
			donor: { select: { id: true, name: true } },
		},
	});

	if (!item) {
		notFound();
	}

	const isOwnItem = !!user && user.id === item.donorId;

	const favoriteRow = user
		? await prisma.favorite.findUnique({
				where: {
					profileId_itemId: {
						profileId: user.id,
						itemId: item.id,
					},
				},
				select: { id: true },
			})
		: null;

	const existingConversation =
		user && !isOwnItem
			? await prisma.conversation.findFirst({
					where: {
						itemId: item.id,
						AND: [
							{ participants: { some: { profileId: user.id } } },
							{ participants: { some: { profileId: item.donorId } } },
						],
					},
					select: { id: true },
				})
			: null;

	const donorName = item.donor.name ?? t('anonymousDonor');
	const pickupMethodLabels = item.pickupMethods.map((method) =>
		method === 'SELF_PICKUP'
			? t('pickupMethodSelfPickup')
			: t('pickupMethodDelivery'),
	);

	return (
		<div className="container mx-auto px-4 py-8">
			<Card>
				<CardContent className="p-4 lg:p-6">
					<div className="grid gap-6 sm:grid-cols-[300px_1fr] sm:items-start">
						<ItemImageGallery
							images={item.images}
							title={item.title}
						/>

						<div className="space-y-4">
							<CardTitle className="text-2xl">{item.title}</CardTitle>
							<div className="flex flex-wrap gap-2">
								<Badge variant="outline">{item.category.name}</Badge>
								<Badge variant="secondary">{item.condition}</Badge>
								<Badge>{t('available')}</Badge>
							</div>

							<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
								{item.description}
							</p>
							<p className="text-sm text-muted-foreground">
								{t('postedBy', { name: donorName })}
							</p>
							<p className="text-sm text-muted-foreground">
								{t('postedOn', {
									date: new Intl.DateTimeFormat(locale, {
										dateStyle: 'medium',
									}).format(item.createdAt),
								})}
							</p>
							<p className="text-sm text-muted-foreground">
								{item.address || t('addressUnavailable')}
							</p>
							<div className="grid gap-2">
								<p className="text-sm font-medium">{t('pickupMethods')}</p>
								<div className="flex flex-wrap gap-2">
									{pickupMethodLabels.map((label) => (
										<Badge
											key={label}
											variant="outline"
										>
											{label}
										</Badge>
									))}
								</div>
							</div>

							<div className="grid justify-items-start gap-2">
								<Button
									className="w-auto"
									variant="outline"
									render={
										<Link
											href={buildProfileHref(item.donor.id, item.donor.name)}
										/>
									}
									nativeButton={false}
								>
									{t('viewDonorProfile')}
								</Button>

								{user && !isOwnItem ? (
									<>
										<StartConversationButton
											itemId={item.id}
											participantId={item.donorId}
											existingConversationId={existingConversation?.id}
										/>
										<div>
											<FavoriteButton
												itemId={item.id}
												isFavorited={!!favoriteRow}
											/>
										</div>
									</>
								) : null}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
