import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { AdminSidebar } from '@/components/admin/sidebar';
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
	const t = await getTranslations({ locale, namespace: 'Admin' });
	return { title: t('title') };
}

export default async function AdminLayout({ children, params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	// Auth check — proxy already ensures user is logged in,
	// but we also verify ADMIN role here via Prisma
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect({ pathname: '/', locale });
		return null;
	}

	const profile = await prisma.profile.findUnique({
		where: { id: user.id },
		select: { role: true },
	});

	if (!profile || profile.role !== 'ADMIN') {
		redirect({ pathname: '/', locale });
		return null;
	}

	return (
		<SidebarProvider>
			<AdminSidebar />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
