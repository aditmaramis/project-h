'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselPrevious,
	CarouselNext,
	useCarousel,
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FeaturedSlide {
	id: string;
	title: string;
	subtitle: string;
	description: string;
	cta: { label: string; href: string };
	image: string;
	accent: 'terracotta' | 'sage';
}

const FEATURED_SLIDES: FeaturedSlide[] = [
	{
		id: '1',
		title: 'Give what you have.',
		subtitle: 'Community gifting',
		description:
			'Hibah connects neighbors who want to donate unused items with people who need them. No transactions — just generosity.',
		cta: { label: 'Browse items', href: '/items' },
		image:
			'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&q=80',
		accent: 'terracotta',
	},
	{
		id: '2',
		title: 'Furniture finds nearby.',
		subtitle: 'Featured category',
		description:
			'Sofas, tables, shelves — quality furniture is being given away in your neighborhood right now.',
		cta: { label: 'See furniture', href: '/items?category=furniture' },
		image:
			'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
		accent: 'sage',
	},
	{
		id: '3',
		title: 'Books deserve new readers.',
		subtitle: 'Trending now',
		description:
			'Pass along the stories that moved you. Someone in your city is looking for their next favorite book.',
		cta: { label: 'Find books', href: '/items?category=books' },
		image:
			'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80',
		accent: 'terracotta',
	},
	{
		id: '4',
		title: 'Post your first item.',
		subtitle: 'Get started',
		description:
			'It takes less than a minute. Photograph what you no longer need and share it with your community.',
		cta: { label: 'Post an item', href: '/dashboard/items/new' },
		image:
			'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80',
		accent: 'sage',
	},
];

function CarouselDots() {
	const { api } = useCarousel();
	const [selectedIndex, setSelectedIndex] = React.useState(0);
	const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

	React.useEffect(() => {
		if (!api) return;
		setScrollSnaps(api.scrollSnapList());
		const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
		api.on('select', onSelect);
		onSelect();
		return () => {
			api.off('select', onSelect);
		};
	}, [api]);

	return (
		<div className="flex items-center gap-2">
			{scrollSnaps.map((_, index) => (
				<button
					key={index}
					type="button"
					aria-label={`Go to slide ${index + 1}`}
					className={cn(
						'h-2 rounded-full transition-all duration-300',
						index === selectedIndex
							? 'w-8 bg-white'
							: 'w-2 bg-white/40 hover:bg-white/60',
					)}
					onClick={() => api?.scrollTo(index)}
				/>
			))}
		</div>
	);
}

export function FeaturedCarousel() {
	return (
		<Carousel
			opts={{ loop: true, align: 'start' }}
			plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
			className="w-full"
		>
			<CarouselContent className="ml-0">
				{FEATURED_SLIDES.map((slide) => (
					<CarouselItem
						key={slide.id}
						className="pl-0"
					>
						<div className="relative h-[70vh] min-h-120 max-h-175 overflow-hidden">
							{/* Background image */}
							<div
								className="absolute inset-0 bg-cover bg-center"
								style={{ backgroundImage: `url(${slide.image})` }}
							/>

							{/* Gradient overlay */}
							<div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent" />

							{/* Bottom fade for blending into page */}
							<div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background to-transparent" />

							{/* Content */}
							<div className="relative h-full container mx-auto px-6 lg:px-12 flex flex-col justify-center">
								<div className="max-w-xl">
									<Badge
										variant="outline"
										className="mb-5 text-xs tracking-widest uppercase px-3 py-1 border-white/30 text-white/80 bg-white/5 backdrop-blur-sm"
									>
										{slide.subtitle}
									</Badge>

									<h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-tight mb-5 text-white">
										{slide.title}
									</h2>

									<p className="text-base lg:text-lg text-white/70 leading-relaxed mb-8 max-w-md">
										{slide.description}
									</p>

									<Link
										href={slide.cta.href}
										className="inline-flex items-center gap-2 rounded-lg px-7 h-11 text-sm font-medium whitespace-nowrap transition-all hover:opacity-90"
										style={{
											background:
												slide.accent === 'terracotta'
													? 'var(--hibah-terracotta)'
													: 'var(--hibah-sage)',
											color: 'white',
										}}
									>
										{slide.cta.label}
										<ArrowRight className="h-4 w-4" />
									</Link>
								</div>
							</div>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>

			{/* Controls — overlaid on bottom left */}
			<div className="absolute bottom-10 left-6 lg:left-12 z-10 flex items-center gap-4">
				<CarouselDots />
			</div>

			{/* Nav arrows — overlaid on right side */}
			<CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white" />
			<CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white" />
		</Carousel>
	);
}
