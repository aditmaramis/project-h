import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { HeaderAuth } from '@/components/layout/header-auth';
import { HeaderCategories } from '@/components/layout/header-categories';
import { HeaderSearch } from '@/components/layout/header-search';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function Header() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const profile = user
		? await prisma.profile.findUnique({
				where: { id: user.id },
				select: { name: true, avatarUrl: true },
			})
		: null;

	const t = await getTranslations('Header');

	return (
		<header className="sticky top-9 z-40 w-full border-b bg-background">
			<div className="container mx-auto flex h-14 items-center gap-4 px-4">
				<Link
					href="/"
					className="flex shrink-0 items-center"
				>
					<Image
						src="/logo.svg"
						alt={t('brand')}
						width={200}
						height={100}
						className="h-9 w-auto md:h-10"
						priority
					/>
					<span className="sr-only">{t('brand')}</span>
				</Link>
				<HeaderCategories />
				<div className="flex flex-1 justify-center">
					<HeaderSearch />
				</div>
				<nav className="flex shrink-0 items-center gap-2">
					<HeaderAuth
						initialIsLoggedIn={!!user}
						initialUserId={user?.id ?? null}
						initialUserName={profile?.name ?? null}
						initialAvatarUrl={profile?.avatarUrl ?? null}
					/>
				</nav>
			</div>
		</header>
	);
}
