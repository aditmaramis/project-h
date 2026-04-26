import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Plus, Pencil } from 'lucide-react';
import { MarkDonatedButton } from '@/components/dashboard/mark-donated-button';
import { DeleteItemButton } from '@/components/dashboard/delete-item-button';
import { buildItemHref } from '@/lib/item-url';

type Props = {
	params: Promise<{ locale: string }>;
};

const statusVariant = {
	AVAILABLE: 'default',
	RESERVED: 'secondary',
	DONATED: 'outline',
} as const;

export default async function MyItemsPage({ params }: Props) {
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

	const items = await prisma.item.findMany({
		where: { donorId: user.id },
		include: { category: true },
		orderBy: { createdAt: 'desc' },
	});

	return (
		<>
			<header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
				<div className="flex items-center gap-2">
					<SidebarTrigger className="-ml-1" />
					<Separator
						orientation="vertical"
						className="mr-2 h-4!"
					/>
					<h1 className="text-sm font-medium">{t('myItems')}</h1>
				</div>
				<Button
					render={<Link href="/dashboard/items/new" />}
					nativeButton={false}
					size="sm"
				>
					<Plus className="mr-1.5 size-4" />
					{t('postItem')}
				</Button>
			</header>

			<div className="flex-1 overflow-auto p-4 md:p-6">
				{items.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 py-20">
						<p className="text-muted-foreground">{t('noItemsYet')}</p>
						<Button
							render={<Link href="/dashboard/items/new" />}
							nativeButton={false}
						>
							{t('postItem')}
						</Button>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-15" />
								<TableHead>{t('itemTitle')}</TableHead>
								<TableHead>{t('category')}</TableHead>
								<TableHead>{t('status')}</TableHead>
								<TableHead>{t('postedDate')}</TableHead>
								<TableHead className="text-right">{t('actions')}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id}>
									<TableCell>
										{item.images[0] ? (
											<img
												src={item.images[0]}
												alt=""
												className="size-10 rounded-md object-cover"
											/>
										) : (
											<div className="size-10 rounded-md bg-muted" />
										)}
									</TableCell>
									<TableCell className="font-medium">
										<Link
											href={buildItemHref({
												categorySlug: item.category.slug,
												itemSlug: item.slug,
											})}
											className="hover:underline"
										>
											{item.title}
										</Link>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{item.category.name}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												statusVariant[
													item.status as keyof typeof statusVariant
												] ?? 'outline'
											}
										>
											{t(
												item.status === 'AVAILABLE'
													? 'available'
													: item.status === 'RESERVED'
														? 'reserved'
														: 'donated',
											)}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{new Date(item.createdAt).toLocaleDateString(locale)}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											{item.status === 'AVAILABLE' && (
												<>
													<Button
														variant="ghost"
														size="icon"
														render={
															<Link href={`/dashboard/items/${item.id}/edit`} />
														}
														nativeButton={false}
													>
														<Pencil className="size-4" />
													</Button>
													<MarkDonatedButton
														itemId={item.id}
														itemTitle={item.title}
													/>
												</>
											)}
											<DeleteItemButton
												itemId={item.id}
												itemTitle={item.title}
											/>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>
		</>
	);
}
