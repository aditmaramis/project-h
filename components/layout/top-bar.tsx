'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Info } from 'lucide-react';
import { HeaderLocation } from '@/components/layout/header-location';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export function TopBar() {
	const t = useTranslations('TopBar');

	return (
		<div className="w-full border-b border-border/50 bg-muted/50 text-sm">
			<div className="container mx-auto flex h-9 items-center justify-between px-4">
				<HeaderLocation />
				<div className="flex items-center gap-2">
					<LanguageSwitcher />
					<Link
						href="/about"
						className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
					>
						<Info className="h-3.5 w-3.5" />
						{t('about')}
					</Link>
				</div>
			</div>
		</div>
	);
}
