import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { Link, redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { buildItemHref } from '@/lib/item-url';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FavoriteButton } from '@/components/dashboard/favorite-button';
import { StartConversationButton } from '@/components/chat/start-conversation-button';
import { ItemImageGallery } from '@/components/items/item-image-gallery';
import { buildProfileHref } from '@/lib/profile-url';

type Props = {
	params: Promise<{ locale: string; category: string; 'item-name': string }>;
};

export default async function ItemDetailPage({ params }: Props) {
	const {
		locale,
		category: rawCategory,
		['item-name']: rawItemSlug,
	} = await params;
	setRequestLocale(locale);
	const t = await getTranslations('Items');
	const dashboardT = await getTranslations('Dashboard');
	const authT = await getTranslations('Auth');

	function formatDisplayLabel(raw: string) {
		return raw
			.split(/[\s_-]+/)
			.filter(Boolean)
			.map(
				(segment) =>
					segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
			)
			.join(' ');
	}

	const normalizedCategory = rawCategory.toLowerCase();
	const normalizedItemSlug = rawItemSlug.toLowerCase();

	const item = await prisma.item.findFirst({
		where: {
			slug: normalizedItemSlug,
			category: { slug: normalizedCategory },
		},
		include: {
			category: { select: { name: true, slug: true } },
			donor: {
				select: { id: true, name: true, avatarUrl: true, accountType: true },
			},
		},
	});

	if (!item) {
		notFound();
	}

	const canonicalHref = buildItemHref({
		categorySlug: item.category.slug,
		itemSlug: item.slug,
	});
	const canonicalItemSlug = item.slug;

	if (rawCategory !== item.category.slug || rawItemSlug !== canonicalItemSlug) {
		redirect({ href: canonicalHref, locale });
		return null;
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const isOwnItem = Boolean(user) && user.id === item.donorId;

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
	const donorInitials =
		donorName
			.split(' ')
			.filter(Boolean)
			.map((part) => part[0])
			.join('')
			.toUpperCase()
			.slice(0, 2) || '?';
	const donorAccountTypeLabel =
		item.donor.accountType === 'ORGANIZATION'
			? authT('organization')
			: authT('personal');
	const pickupMethodLabels = item.pickupMethods.map((method) =>
		method === 'SELF_PICKUP'
			? t('pickupMethodSelfPickup')
			: t('pickupMethodDelivery'),
	);
	const conditionLabel =
		item.condition === 'NEW'
			? dashboardT('conditionNew')
			: item.condition === 'LIKE_NEW'
				? dashboardT('conditionLikeNew')
				: item.condition === 'GOOD'
					? dashboardT('conditionGood')
					: item.condition === 'FAIR'
						? dashboardT('conditionFair')
						: formatDisplayLabel(item.condition);
	const itemPath =
		locale === 'en' ? canonicalHref : `/${locale}${canonicalHref}`;
	const shareHref = `mailto:?subject=${encodeURIComponent(item.title)}&body=${encodeURIComponent(`${item.title}\n${itemPath}`)}`;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
				<Card className="ring-0 shadow-none">
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
									<Badge variant="secondary">{conditionLabel}</Badge>
									<Badge>{t('available')}</Badge>
								</div>
								<Separator />

								<div className="grid gap-3">
									<p className="text-sm font-medium">{t('productDetails')}</p>
									<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
										{item.description}
									</p>
									<p className="text-sm text-muted-foreground">
										{t('postedOn', {
											date: new Intl.DateTimeFormat(locale, {
												dateStyle: 'medium',
											}).format(item.createdAt),
										})}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="h-fit lg:mt-10 lg:w-75">
					<CardContent className="space-y-4 px-4 py-3 lg:px-5 lg:py-2">
						<div className="grid gap-3">
							<Link
								href={buildProfileHref(item.donor.id, item.donor.name)}
								className="group inline-flex w-full items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
							>
								<Avatar className="size-14">
									<AvatarImage
										src={item.donor.avatarUrl ?? undefined}
										alt={donorName}
									/>
									<AvatarFallback className="text-base">
										{donorInitials}
									</AvatarFallback>
								</Avatar>
								<div className="grid gap-1">
									<span className="text-base font-semibold group-hover:underline">
										{donorName}
									</span>
									<Badge
										variant="secondary"
										className="w-fit text-xs"
									>
										{donorAccountTypeLabel}
									</Badge>
								</div>
							</Link>
						</div>

						<Separator />

						<div className="grid gap-2">
							<p className="text-sm font-medium">{t('itemLocation')}</p>
							<p className="text-sm text-muted-foreground">
								{item.address || t('addressUnavailable')}
							</p>
						</div>

						<Separator />

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

						<Separator />

						<div className="grid gap-2">
							{user && !isOwnItem ? (
								<>
									<StartConversationButton
										itemId={item.id}
										participantId={item.donorId}
										existingConversationId={existingConversation?.id}
										label={t('getInTouch')}
									/>
									<div className="flex items-center gap-1">
										<FavoriteButton
											itemId={item.id}
											isFavorited={Boolean(favoriteRow)}
										/>
										<Button
											variant="ghost"
											size="icon"
											className="size-8 rounded-full bg-background/80 backdrop-blur-sm"
											render={
												<a
													href={shareHref}
													aria-label={t('share')}
												/>
											}
											nativeButton={false}
										>
											<Share2 className="size-4" />
										</Button>
									</div>
								</>
							) : (
								<Button
									variant="ghost"
									size="icon"
									className="size-8 rounded-full bg-background/80 backdrop-blur-sm"
									render={
										<a
											href={shareHref}
											aria-label={t('share')}
										/>
									}
									nativeButton={false}
								>
									<Share2 className="size-4" />
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
