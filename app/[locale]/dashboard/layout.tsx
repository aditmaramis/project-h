import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'Dashboard' });
	return { title: t('title') };
}

export default async function DashboardLayout({ children, params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

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
		select: { name: true, avatarUrl: true },
	});

	return (
		<SidebarProvider className="min-h-0! flex-1 **:data-[slot=sidebar-container]:top-21! **:data-[slot=sidebar-container]:h-[calc(100svh-5.25rem)]!">
			<DashboardSidebar
				userName={profile?.name ?? null}
				avatarUrl={profile?.avatarUrl ?? null}
			/>
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
