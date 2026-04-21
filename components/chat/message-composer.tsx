'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MessageComposer({
	conversationId,
}: {
	conversationId: string;
}) {
	const router = useRouter();
	const t = useTranslations('Chat');
	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		const trimmed = content.trim();
		if (!trimmed) {
			setError(t('messageRequired'));
			return;
		}

		setLoading(true);
		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ conversationId, content: trimmed }),
		});
		setLoading(false);

		if (!res.ok) {
			setError(t('sendMessageError'));
			return;
		}

		setContent('');
		router.refresh();
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="grid gap-2"
		>
			<div className="flex gap-2">
				<Input
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder={t('messagePlaceholder')}
					maxLength={2000}
				/>
				<Button
					type="submit"
					disabled={loading}
				>
					{loading ? t('sending') : t('send')}
				</Button>
			</div>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</form>
	);
}
