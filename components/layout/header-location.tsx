'use client';

import { useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useGeolocation } from '@/hooks/use-geolocation';

export function HeaderLocation() {
	const { latitude, longitude, loading, error } = useGeolocation();
	const [locationName, setLocationName] = useState<string | null>(null);
	const [resolving, setResolving] = useState(false);
	const t = useTranslations('Location');

	useEffect(() => {
		if (!latitude || !longitude) return;

		setResolving(true);

		const controller = new AbortController();

		fetch(
			`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
			{
				headers: { 'Accept-Language': 'en' },
				signal: controller.signal,
			},
		)
			.then((res) => res.json())
			.then((data) => {
				const addr = data.address;
				const name =
					addr?.city ||
					addr?.town ||
					addr?.village ||
					addr?.county ||
					addr?.state ||
					t('fallback');
				setLocationName(name);
			})
			.catch(() => {
				setLocationName(t('fallback'));
			})
			.finally(() => {
				setResolving(false);
			});

		return () => controller.abort();
	}, [latitude, longitude, t]);

	const isLoading = loading || resolving;

	if (error && !isLoading) {
		return (
			<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
				<MapPin className="h-4 w-4" />
				<span>{t('unavailable')}</span>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span>{t('finding')}</span>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-1.5 text-sm font-medium">
			<MapPin className="h-4 w-4 text-hibah-terracotta" />
			<span>{locationName}</span>
		</div>
	);
}
