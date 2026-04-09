'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
	Laptop,
	Shirt,
	Armchair,
	BookOpen,
	UtensilsCrossed,
	Dumbbell,
	ToyBrick,
	Package,
	type LucideIcon,
} from 'lucide-react';
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

const iconMap: Record<string, LucideIcon> = {
	Laptop,
	Shirt,
	Armchair,
	BookOpen,
	UtensilsCrossed,
	Dumbbell,
	ToyBrick,
	Package,
};

const categories = [
	{ key: 'electronics', slug: 'electronics', icon: 'Laptop' },
	{ key: 'clothing', slug: 'clothing', icon: 'Shirt' },
	{ key: 'furniture', slug: 'furniture', icon: 'Armchair' },
	{ key: 'books', slug: 'books', icon: 'BookOpen' },
	{ key: 'kitchen', slug: 'kitchen', icon: 'UtensilsCrossed' },
	{ key: 'sports', slug: 'sports', icon: 'Dumbbell' },
	{ key: 'toys', slug: 'toys', icon: 'ToyBrick' },
	{ key: 'other', slug: 'other', icon: 'Package' },
];

export function HeaderCategories() {
	const t = useTranslations('Categories');

	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger className="h-8 text-sm">
						{t('trigger')}
					</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid w-[320px] grid-cols-2 gap-1 p-2">
							{categories.map((cat) => {
								const Icon = iconMap[cat.icon] ?? Package;
								return (
									<li key={cat.slug}>
										<NavigationMenuLink
											render={
												<Link
													href={`/items?category=${cat.slug}`}
													className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
												/>
											}
										>
											<Icon className="h-4 w-4 text-muted-foreground" />
											{t(cat.key)}
										</NavigationMenuLink>
									</li>
								);
							})}
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
