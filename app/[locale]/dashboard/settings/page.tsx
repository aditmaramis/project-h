import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Link, redirect } from '@/i18n/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form';
import { buildProfileHref } from '@/lib/profile-url';

type Props = {
	params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('Dashboard');

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect({ href: '/', locale });
		return null;
	}

	const profile = await prisma.profile.findUnique({
		where: { id: user.id },
		select: {
			name: true,
			bio: true,
			avatarUrl: true,
			accountType: true,
			isVerified: true,
		},
	});

	if (!profile) {
		redirect({ href: '/', locale });
		return null;
	}

	return (
		<>
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 h-4!"
				/>
				<h1 className="text-sm font-medium">{t('profileSettings')}</h1>
			</header>

			<div className="flex-1 overflow-auto p-4 md:p-6">
				<div className="mx-auto max-w-2xl">
					<div className="mb-4 flex justify-end">
						<Button
							variant="outline"
							size="sm"
							render={<Link href={buildProfileHref(user.id, profile.name)} />}
							nativeButton={false}
						>
							{t('viewPublicProfile')}
						</Button>
					</div>
					<ProfileSettingsForm
						initialName={profile.name ?? ''}
						initialBio={profile.bio ?? ''}
						initialAvatarUrl={profile.avatarUrl ?? ''}
						accountType={profile.accountType}
						isVerified={profile.isVerified}
					/>
				</div>
			</div>
		</>
	);
}
