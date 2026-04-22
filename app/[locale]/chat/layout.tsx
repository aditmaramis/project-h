import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function ChatLayout({ children, params }: Props) {
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
				userId={user.id}
				userName={profile?.name ?? null}
				avatarUrl={profile?.avatarUrl ?? null}
			/>
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
