'use client';

import { useState, useEffect, useRef } from 'react';

interface GeolocationState {
	latitude: number | null;
	longitude: number | null;
	error: string | null;
	loading: boolean;
}

/**
 * Hook to get the user's current geolocation via the browser Geolocation API.
 */
export function useGeolocation() {
	const [state, setState] = useState<GeolocationState>(() => ({
		latitude: null,
		longitude: null,
		error: !navigator.geolocation
			? 'Geolocation is not supported by your browser'
			: null,
		loading: !!navigator.geolocation,
	}));

	const didRun = useRef(false);

	useEffect(() => {
		if (didRun.current || !navigator.geolocation) return;
		didRun.current = true;

		navigator.geolocation.getCurrentPosition(
			(position) => {
				setState({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
					error: null,
					loading: false,
				});
			},
			(err) => {
				setState((prev) => ({
					...prev,
					error: err.message,
					loading: false,
				}));
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 300000,
			},
		);
	}, []);

	return state;
}
