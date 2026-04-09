'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const localeLabels: Record<string, string> = {
	en: 'EN',
	id: 'ID',
};

const localeNames: Record<string, string> = {
	en: 'English',
	id: 'Bahasa Indonesia',
};

export function LanguageSwitcher() {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations('LanguageSwitcher');

	const nextLocale = locale === 'en' ? 'id' : 'en';

	function handleSwitch() {
		router.replace(pathname, { locale: nextLocale });
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleSwitch}
			className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
			title={t('switchTo', { language: localeNames[nextLocale] })}
		>
			<Globe className="h-3.5 w-3.5" />
			<span className="text-xs font-medium">{localeLabels[locale]}</span>
		</Button>
	);
}
