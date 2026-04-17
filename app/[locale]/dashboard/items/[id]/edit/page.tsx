import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ItemForm } from '@/components/dashboard/item-form';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ locale: string; id: string }>;
};

export default async function EditItemPage({ params }: Props) {
	const { locale, id } = await params;
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

	const [item, categories] = await Promise.all([
		prisma.item.findUnique({ where: { id } }),
		prisma.category.findMany({ orderBy: { name: 'asc' } }),
	]);

	if (!item || item.donorId !== user.id) {
		notFound();
	}

	return (
		<>
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 h-4!"
				/>
				<h1 className="text-sm font-medium">{t('editItem')}</h1>
			</header>

			<div className="flex-1 overflow-auto p-4 md:p-6">
				<div className="mx-auto max-w-3xl">
					<ItemForm
						categories={categories}
						initialData={{
							id: item.id,
							title: item.title,
							description: item.description,
							condition: item.condition,
							categoryId: item.categoryId,
							latitude: item.latitude,
							longitude: item.longitude,
							address: item.address,
							images: item.images,
							status: item.status,
						}}
					/>
				</div>
			</div>
		</>
	);
}
