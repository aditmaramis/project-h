'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function HeaderSearch() {
	const router = useRouter();
	const [query, setQuery] = useState('');
	const t = useTranslations('Search');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = query.trim();
		if (trimmed) {
			router.push(`/items?q=${encodeURIComponent(trimmed)}`);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="relative w-full max-w-sm"
		>
			<Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				placeholder={t('placeholder')}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				className="h-8 pl-8 text-sm"
			/>
		</form>
	);
}
