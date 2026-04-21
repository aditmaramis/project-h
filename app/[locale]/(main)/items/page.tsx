import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/dashboard/favorite-button';

type Props = {
	params: Promise<{ locale: string }>;
};

export default async function BrowseItemsPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('Items');

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const items = await prisma.item.findMany({
		where: { status: 'AVAILABLE' },
		include: {
			category: { select: { name: true } },
			donor: { select: { id: true, name: true } },
		},
		orderBy: { createdAt: 'desc' },
		take: 60,
	});

	const favoriteRows = user
		? await prisma.favorite.findMany({
				where: { profileId: user.id },
				select: { itemId: true },
			})
		: [];
	const favoriteItemIds = new Set(favoriteRows.map((row) => row.itemId));

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>

			{items.length === 0 ? (
				<Card>
					<CardContent className="py-10 text-center text-muted-foreground">
						{t('empty')}
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{items.map((item) => {
						const donorName = item.donor.name ?? t('anonymousDonor');
						return (
							<Card
								key={item.id}
								className="overflow-hidden"
							>
								<div className="relative aspect-4/3 bg-muted">
									{item.images[0] ? (
										<img
											src={item.images[0]}
											alt={item.title}
											className="size-full object-cover"
										/>
									) : null}
									{user && user.id !== item.donorId ? (
										<div className="absolute right-2 top-2">
											<FavoriteButton
												itemId={item.id}
												isFavorited={favoriteItemIds.has(item.id)}
											/>
										</div>
									) : null}
								</div>
								<CardHeader className="pb-2">
									<CardTitle className="line-clamp-1 text-base">
										<Link
											href={`/items/${item.id}`}
											className="hover:underline"
										>
											{item.title}
										</Link>
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-0">
									<div className="mb-2 flex flex-wrap gap-2">
										<Badge variant="outline">{item.category.name}</Badge>
										<Badge variant="secondary">{item.condition}</Badge>
									</div>
									<p className="text-sm text-muted-foreground">
										{t('postedBy', { name: donorName })}
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
