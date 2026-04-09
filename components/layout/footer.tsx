'use client';

import { useTranslations } from 'next-intl';

export function Footer() {
	const t = useTranslations('Footer');

	return (
		<footer className="border-t py-6">
			<div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
				<p>{t('copyright', { year: new Date().getFullYear() })}</p>
			</div>
		</footer>
	);
}
