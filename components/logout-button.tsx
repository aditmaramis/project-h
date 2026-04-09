'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
	const router = useRouter();
	const t = useTranslations('Auth');

	async function handleLogout() {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.refresh();
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleLogout}
		>
			{t('logout')}
		</Button>
	);
}
