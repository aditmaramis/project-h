'use client';

import * as React from 'react';
import Image, { type ImageLoader } from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	type CarouselApi,
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel';

type ItemImageGalleryProps = {
	images: string[];
	title: string;
};

const passthroughImageLoader: ImageLoader = ({ src }) => src;

function getRenderableImages(images: string[]) {
	return images
		.map((image) => image.trim())
		.filter((image): image is string => image.length > 0);
}

export function ItemImageGallery({ images, title }: ItemImageGalleryProps) {
	const [api, setApi] = React.useState<CarouselApi>();
	const [selectedIndex, setSelectedIndex] = React.useState(0);
	const renderableImages = React.useMemo(
		() => getRenderableImages(images),
		[images],
	);

	React.useEffect(() => {
		if (!api) {
			return;
		}

		const onSelect = () => {
			setSelectedIndex(api.selectedScrollSnap());
		};

		onSelect();
		api.on('select', onSelect);
		api.on('reInit', onSelect);

		return () => {
			api.off('select', onSelect);
			api.off('reInit', onSelect);
		};
	}, [api]);

	if (renderableImages.length === 0) {
		return <div className="h-75 w-75 rounded-xl border bg-muted" />;
	}

	return (
		<div className="w-75 max-w-full space-y-3">
			<Carousel
				className="w-75 max-w-full"
				setApi={setApi}
				opts={{
					align: 'start',
					loop: renderableImages.length > 1,
				}}
			>
				<CarouselContent className="ml-0">
					{renderableImages.map((image, index) => (
						<CarouselItem
							key={`${image}-${index}`}
							className="pl-0"
						>
							<div className="relative h-75 w-75 overflow-hidden rounded-xl border bg-muted">
								<Image
									src={image}
									alt={title}
									loader={passthroughImageLoader}
									unoptimized
									fill
									sizes="300px"
									className="object-cover"
								/>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>

				{renderableImages.length > 1 ? (
					<>
						<CarouselPrevious className="left-3 top-1/2 -translate-y-1/2" />
						<CarouselNext className="right-3 top-1/2 -translate-y-1/2" />
					</>
				) : null}
			</Carousel>

			{renderableImages.length > 1 ? (
				<div className="grid w-75 grid-cols-5 gap-2">
					{renderableImages.map((image, index) => (
						<Button
							key={`thumbnail-${image}-${index}`}
							type="button"
							variant="ghost"
							onClick={() => api?.scrollTo(index)}
							aria-label={`${title} ${index + 1}`}
							className={cn(
								'h-auto overflow-hidden rounded-md border p-0',
								selectedIndex === index
									? 'border-primary ring-2 ring-primary/40'
									: 'border-border/70 opacity-75 hover:opacity-100',
							)}
						>
							<div className="relative aspect-square w-full">
								<Image
									src={image}
									alt={title}
									loader={passthroughImageLoader}
									unoptimized
									fill
									sizes="96px"
									className="object-cover"
								/>
							</div>
						</Button>
					))}
				</div>
			) : null}
		</div>
	);
}
