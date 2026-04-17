import { setRequestLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ItemForm } from '@/components/dashboard/item-form';

type Props = {
	params: Promise<{ locale: string }>;
};

export default async function NewItemPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('Dashboard');

	const categories = await prisma.category.findMany({
		orderBy: { name: 'asc' },
	});

	return (
		<>
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 h-4!"
				/>
				<h1 className="text-sm font-medium">{t('postItem')}</h1>
			</header>

			<div className="flex-1 overflow-auto p-4 md:p-6">
				<div className="mx-auto max-w-3xl">
					<ItemForm categories={categories} />
				</div>
			</div>
		</>
	);
}
