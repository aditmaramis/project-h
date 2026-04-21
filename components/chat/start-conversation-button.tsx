'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function StartConversationButton({
	itemId,
	participantId,
	existingConversationId,
}: {
	itemId: string;
	participantId: string;
	existingConversationId?: string;
}) {
	const router = useRouter();
	const t = useTranslations('Chat');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleStartConversation() {
		setError(null);

		if (existingConversationId) {
			router.push(`/chat/${existingConversationId}`);
			return;
		}

		setLoading(true);
		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ itemId, participantId }),
		});
		setLoading(false);

		if (!res.ok) {
			setError(t('startConversationError'));
			return;
		}

		const data = await res.json();
		if (!data?.id) {
			setError(t('startConversationError'));
			return;
		}

		router.push(`/chat/${data.id}`);
	}

	return (
		<div className="grid gap-2">
			<Button
				onClick={handleStartConversation}
				disabled={loading}
			>
				{loading
					? t('startingConversation')
					: existingConversationId
						? t('openConversation')
						: t('startConversation')}
			</Button>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</div>
	);
}
