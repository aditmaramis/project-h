'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FavoriteButton({
	itemId,
	isFavorited,
}: {
	itemId: string;
	isFavorited: boolean;
}) {
	const router = useRouter();
	const [favorited, setFavorited] = useState(isFavorited);
	const [loading, setLoading] = useState(false);

	async function toggle() {
		setLoading(true);
		const method = favorited ? 'DELETE' : 'POST';

		const res = await fetch(`/api/favorites/${itemId}`, { method });

		if (res.ok) {
			setFavorited(!favorited);
			router.refresh();
		}
		setLoading(false);
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			className={cn(
				'size-8 rounded-full bg-background/80 backdrop-blur-sm',
				favorited && 'text-red-500',
			)}
			onClick={toggle}
			disabled={loading}
		>
			<Heart className={cn('size-4', favorited && 'fill-current')} />
		</Button>
	);
}
