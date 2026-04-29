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
	const [state, setState] = useState<GeolocationState>({
		latitude: null,
		longitude: null,
		error: null,
		loading: true,
	});

	const didRun = useRef(false);

	useEffect(() => {
		if (didRun.current) return;
		didRun.current = true;

		if (!navigator.geolocation) {
			const timeoutId = window.setTimeout(() => {
				setState({
					latitude: null,
					longitude: null,
					error: 'Geolocation is not supported by your browser',
					loading: false,
				});
			}, 0);

			return () => window.clearTimeout(timeoutId);
		}

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
