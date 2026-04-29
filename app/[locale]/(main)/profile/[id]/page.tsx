import { CalendarDays, Package } from 'lucide-react';
import Image, { type ImageLoader } from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { buildItemHref } from '@/lib/item-url';
import { buildProfileSlug, parseProfileSlug } from '@/lib/profile-url';

type Props = {
	params: Promise<{ locale: string; id: string }>;
};

const passthroughImageLoader: ImageLoader = ({ src }) => src;

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'ProfilePage' });

	return {
		title: t('title'),
	};
}

export default async function PublicProfilePage({ params }: Props) {
	const { locale, id: rawSlug } = await params;
	setRequestLocale(locale);

	const t = await getTranslations('ProfilePage');
	const { idToken } = parseProfileSlug(rawSlug);

	if (!idToken) {
		notFound();
	}

	const profileIdCandidates = await prisma.$queryRaw<Array<{ id: string }>>`
		SELECT id::text AS id
		FROM profiles
		WHERE id::text LIKE ${`${idToken}%`}
		LIMIT 20
	`;

	if (profileIdCandidates.length === 0) {
		notFound();
	}

	const profileCandidates = await prisma.profile.findMany({
		where: {
			id: { in: profileIdCandidates.map((candidate) => candidate.id) },
		},
		select: {
			id: true,
			name: true,
			bio: true,
			avatarUrl: true,
			accountType: true,
			isVerified: true,
			createdAt: true,
			items: {
				where: { status: 'AVAILABLE' },
				orderBy: { createdAt: 'desc' },
				take: 6,
				select: {
					id: true,
					title: true,
					slug: true,
					images: true,
					condition: true,
					category: {
						select: {
							name: true,
							slug: true,
						},
					},
				},
			},
			_count: {
				select: {
					items: true,
				},
			},
		},
	});

	const profile = profileCandidates.find((candidate) => {
		return rawSlug === buildProfileSlug(candidate.id, candidate.name);
	});

	const resolvedProfile = profile ?? profileCandidates[0] ?? null;

	if (!resolvedProfile) {
		notFound();
	}

	const expectedSlug = buildProfileSlug(
		resolvedProfile.id,
		resolvedProfile.name,
	);

	if (rawSlug !== expectedSlug) {
		redirect({ href: `/profile/${expectedSlug}`, locale });
		return null;
	}

	const initials = resolvedProfile.name
		? resolvedProfile.name
				.split(' ')
				.map((part) => part[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: '?';
	const joinedDate = new Intl.DateTimeFormat(locale, {
		month: 'long',
		year: 'numeric',
	}).format(resolvedProfile.createdAt);
	const accountTypeLabel =
		resolvedProfile.accountType === 'ORGANIZATION'
			? t('organization')
			: t('personal');

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[320px,1fr]">
				<Card className="h-fit">
					<CardHeader className="items-center text-center">
						<Avatar className="size-24">
							<AvatarImage
								src={resolvedProfile.avatarUrl ?? undefined}
								alt={resolvedProfile.name ?? t('anonymous')}
							/>
							<AvatarFallback className="text-lg">{initials}</AvatarFallback>
						</Avatar>
						<CardTitle className="text-2xl">
							{resolvedProfile.name ?? t('anonymous')}
						</CardTitle>
						<div className="flex flex-wrap items-center justify-center gap-2">
							<Badge variant="secondary">{accountTypeLabel}</Badge>
							<Badge
								variant={resolvedProfile.isVerified ? 'default' : 'outline'}
							>
								{resolvedProfile.isVerified ? t('verified') : t('unverified')}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-4 text-sm text-muted-foreground">
						<div className="flex items-center justify-center gap-2">
							<CalendarDays className="size-4" />
							<span>{t('memberSince', { date: joinedDate })}</span>
						</div>
						{resolvedProfile.bio ? (
							<p className="text-center text-foreground/90">
								{resolvedProfile.bio}
							</p>
						) : (
							<p className="text-center">{t('noBio')}</p>
						)}
					</CardContent>
				</Card>

				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="flex items-center gap-2 font-semibold text-lg">
							<Package className="size-5" />
							{t('availableItems')}
						</h2>
						<Badge variant="outline">
							{t('totalItems', { count: resolvedProfile._count.items })}
						</Badge>
					</div>

					{resolvedProfile.items.length === 0 ? (
						<Card>
							<CardContent className="py-10 text-center text-muted-foreground">
								{t('noAvailableItems')}
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 sm:grid-cols-2">
							{resolvedProfile.items.map((item) => (
								<Card key={item.id}>
									<CardContent className="space-y-3 p-4">
										<div className="relative aspect-4/3 overflow-hidden rounded-md bg-muted">
											{item.images[0] ? (
												<Image
													src={item.images[0]}
													alt={item.title}
													loader={passthroughImageLoader}
													unoptimized
													fill
													sizes="(min-width: 640px) 50vw, 100vw"
													className="size-full object-cover"
												/>
											) : null}
										</div>
										<div className="space-y-2">
											<p className="line-clamp-1 font-medium">{item.title}</p>
											<div className="flex flex-wrap gap-2">
												<Badge variant="outline">{item.category.name}</Badge>
												<Badge variant="secondary">{item.condition}</Badge>
											</div>
										</div>
										<Button
											variant="outline"
											className="w-full"
											render={
												<Link
													href={buildItemHref({
														categorySlug: item.category.slug,
														itemSlug: item.slug,
													})}
												/>
											}
											nativeButton={false}
										>
											{t('viewItem')}
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
