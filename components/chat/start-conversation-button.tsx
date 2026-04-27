'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { openFloatingChatWidget } from '@/components/chat/floating-chat-events';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function StartConversationButton({
	itemId,
	participantId,
	existingConversationId,
	label,
	openInWidget = false,
	containerClassName,
	buttonClassName,
}: {
	itemId: string;
	participantId: string;
	existingConversationId?: string;
	label?: string;
	openInWidget?: boolean;
	containerClassName?: string;
	buttonClassName?: string;
}) {
	const router = useRouter();
	const t = useTranslations('Chat');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleStartConversation() {
		setError(null);

		if (existingConversationId) {
			if (openInWidget) {
				openFloatingChatWidget({ conversationId: existingConversationId });
				return;
			}

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

		if (openInWidget) {
			openFloatingChatWidget({ conversationId: data.id });
			return;
		}

		router.push(`/chat/${data.id}`);
	}

	return (
		<div className={cn('grid gap-2', containerClassName)}>
			<Button
				className={buttonClassName}
				onClick={handleStartConversation}
				disabled={loading}
			>
				{loading
					? t('startingConversation')
					: (label ??
						(existingConversationId
							? t('openConversation')
							: t('startConversation')))}
			</Button>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</div>
	);
}
