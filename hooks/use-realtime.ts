'use client';

import { useEffect } from 'react';
import { useSupabase } from './use-supabase';

/**
 * Subscribe to a Supabase Realtime channel.
 * Primarily used for live chat message updates.
 */
export function useRealtime(
	channelName: string,
	event: string,
	callback: (payload: Record<string, unknown>) => void,
) {
	const supabase = useSupabase();

	useEffect(() => {
		const channel = supabase
			.channel(channelName)
			.on('broadcast', { event }, (payload) => {
				callback(payload.payload as Record<string, unknown>);
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase, channelName, event, callback]);
}
