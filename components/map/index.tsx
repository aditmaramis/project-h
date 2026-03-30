'use client';

import dynamic from 'next/dynamic';

// Leaflet must be loaded client-side only (no SSR)
export const MapView = dynamic(() => import('./map-view-inner'), {
	ssr: false,
	loading: () => (
		<div className="h-[400px] w-full animate-pulse rounded-lg bg-muted" />
	),
});

export const LocationPicker = dynamic(() => import('./location-picker-inner'), {
	ssr: false,
	loading: () => (
		<div className="h-[300px] w-full animate-pulse rounded-lg bg-muted" />
	),
});
