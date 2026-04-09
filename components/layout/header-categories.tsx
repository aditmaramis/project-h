'use client';

import Link from 'next/link';
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
	{ name: 'Electronics', slug: 'electronics', icon: 'Laptop' },
	{ name: 'Clothing', slug: 'clothing', icon: 'Shirt' },
	{ name: 'Furniture', slug: 'furniture', icon: 'Armchair' },
	{ name: 'Books', slug: 'books', icon: 'BookOpen' },
	{ name: 'Kitchen', slug: 'kitchen', icon: 'UtensilsCrossed' },
	{ name: 'Sports', slug: 'sports', icon: 'Dumbbell' },
	{ name: 'Toys', slug: 'toys', icon: 'ToyBrick' },
	{ name: 'Other', slug: 'other', icon: 'Package' },
];

export function HeaderCategories() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger className="h-8 text-sm">
						Categories
					</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid w-[320px] grid-cols-2 gap-1 p-2">
							{categories.map((cat) => {
								const Icon = iconMap[cat.icon] ?? Package;
								return (
									<li key={cat.slug}>
										<NavigationMenuLink asChild>
											<Link
												href={`/items?category=${cat.slug}`}
												className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
											>
												<Icon className="h-4 w-4 text-muted-foreground" />
												{cat.name}
											</Link>
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
