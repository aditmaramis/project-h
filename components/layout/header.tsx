import { Gift } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { HeaderAuth } from '@/components/layout/header-auth';
import { HeaderCategories } from '@/components/layout/header-categories';
import { HeaderSearch } from '@/components/layout/header-search';
import { createClient } from '@/lib/supabase/server';

export async function Header() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const t = await getTranslations('Header');

	return (
		<header className="sticky top-9 z-40 w-full border-b bg-background">
			<div className="container mx-auto flex h-14 items-center gap-4 px-4">
				<Link
					href="/"
					className="flex shrink-0 items-center gap-2 font-bold text-xl"
				>
					<Gift className="h-5 w-5" />
					{t('brand')}
				</Link>
				<HeaderCategories />
				<div className="flex flex-1 justify-center">
					<HeaderSearch />
				</div>
				<nav className="flex shrink-0 items-center gap-2">
					<HeaderAuth initialIsLoggedIn={!!user} />
				</nav>
			</div>
		</header>
	);
}
