import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FavoriteButton } from '@/components/dashboard/favorite-button';

type Props = {
	params: Promise<{ locale: string }>;
};

export default async function FavoritesPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('Dashboard');

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect({ href: '/', locale });
		return null;
	}

	const favorites = await prisma.favorite.findMany({
		where: { profileId: user.id },
		include: {
			item: {
				include: { category: true },
			},
		},
		orderBy: { createdAt: 'desc' },
	});

	return (
		<>
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 h-4!"
				/>
				<h1 className="text-sm font-medium">{t('favorites')}</h1>
			</header>

			<div className="flex-1 overflow-auto p-4 md:p-6">
				{favorites.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 py-20">
						<p className="text-muted-foreground">{t('noFavorites')}</p>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{favorites.map(({ item }) => (
							<Card
								key={item.id}
								className="overflow-hidden"
							>
								<div className="relative aspect-4/3">
									{item.images[0] ? (
										<img
											src={item.images[0]}
											alt={item.title}
											className="size-full object-cover"
										/>
									) : (
										<div className="size-full bg-muted" />
									)}
									<div className="absolute right-2 top-2">
										<FavoriteButton
											itemId={item.id}
											isFavorited={true}
										/>
									</div>
								</div>
								<CardContent className="p-3">
									<Link
										href={`/items/${item.id}`}
										className="font-medium hover:underline line-clamp-1"
									>
										{item.title}
									</Link>
									<div className="mt-1 flex items-center gap-2">
										<Badge
											variant="outline"
											className="text-xs"
										>
											{item.category.name}
										</Badge>
										<Badge
											variant="secondary"
											className="text-xs"
										>
											{item.condition}
										</Badge>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</>
	);
}
