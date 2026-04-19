import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Package,
	PackageCheck,
	Heart,
	MessageSquare,
	Plus,
	ArrowRight,
} from 'lucide-react';

type Props = {
	params: Promise<{ locale: string }>;
};

function getGreetingKey(hour: number): string {
	if (hour < 12) return 'greetingMorning';
	if (hour < 17) return 'greetingAfternoon';
	if (hour < 21) return 'greetingEvening';
	return 'greetingDefault';
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
	AVAILABLE: 'default',
	RESERVED: 'secondary',
	DONATED: 'outline',
};

export default async function DashboardPage({ params }: Props) {
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

	const [
		profile,
		totalItems,
		activeItems,
		donatedItems,
		activeConversations,
		totalFavorites,
		recentItems,
	] = await Promise.all([
		prisma.profile.findUnique({
			where: { id: user.id },
			select: { name: true },
		}),
		prisma.item.count({ where: { donorId: user.id } }),
		prisma.item.count({
			where: { donorId: user.id, status: 'AVAILABLE' },
		}),
		prisma.item.count({
			where: { donorId: user.id, status: 'DONATED' },
		}),
		prisma.conversation.count({
			where: {
				participants: { some: { profileId: user.id } },
			},
		}),
		prisma.favorite.count({ where: { profileId: user.id } }),
		prisma.item.findMany({
			where: { donorId: user.id },
			include: {
				category: true,
			},
			orderBy: { createdAt: 'desc' },
			take: 5,
		}),
	]);

	const hour = new Date().getHours();
	const greetingKey = getGreetingKey(hour);
	const userName = profile?.name ?? '';

	const stats = [
		{ key: 'totalItems', value: totalItems, icon: Package },
		{ key: 'activeItems', value: activeItems, icon: PackageCheck },
		{ key: 'donatedItems', value: donatedItems, icon: Package },
		{
			key: 'activeConversations',
			value: activeConversations,
			icon: MessageSquare,
		},
		{ key: 'totalFavorites', value: totalFavorites, icon: Heart },
	] as const;

	return (
		<>
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 h-4!"
				/>
				<h1 className="text-sm font-medium">{t('overview')}</h1>
			</header>

			<div className="flex-1 overflow-auto p-4 md:p-6">
				{/* Greeting */}
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-2xl font-bold tracking-tight">
						{t(greetingKey, { name: userName })}
					</h2>
					<Button
						render={<Link href="/dashboard/items/new" />}
						nativeButton={false}
						size="sm"
					>
						<Plus className="mr-1 size-4" />
						{t('postItem')}
					</Button>
				</div>

				{/* Stats cards */}
				<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					{stats.map(({ key, value, icon: Icon }) => (
						<Card key={key}>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardDescription>{t(key)}</CardDescription>
								<Icon className="size-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{value}</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Recent items */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>{t('recentItems')}</CardTitle>
							<CardDescription>
								{totalItems > 0
									? `${totalItems} ${t('totalItems').toLowerCase()}`
									: t('noItems')}
							</CardDescription>
						</div>
						{totalItems > 5 && (
							<Button
								variant="ghost"
								size="sm"
								render={<Link href="/dashboard/items" />}
								nativeButton={false}
							>
								{t('viewAll')}
								<ArrowRight className="ml-1 size-4" />
							</Button>
						)}
					</CardHeader>
					<CardContent>
						{recentItems.length === 0 ? (
							<div className="flex flex-col items-center gap-3 py-8 text-center">
								<Package className="size-10 text-muted-foreground" />
								<p className="text-sm text-muted-foreground">{t('noItems')}</p>
								<Button
									size="sm"
									variant="outline"
									render={<Link href="/dashboard/items/new" />}
									nativeButton={false}
								>
									<Plus className="mr-1 size-4" />
									{t('postItem')}
								</Button>
							</div>
						) : (
							<div className="divide-y">
								{recentItems.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
									>
										{item.images[0] && (
											<img
												src={item.images[0]}
												alt={item.title}
												className="size-12 rounded-md object-cover"
											/>
										)}
										<div className="flex-1 min-w-0">
											<p className="truncate font-medium text-sm">
												{item.title}
											</p>
											<p className="text-xs text-muted-foreground">
												{item.category.name} &middot;{' '}
												{new Date(item.createdAt).toLocaleDateString(locale)}
											</p>
										</div>
										<Badge variant={statusVariant[item.status] ?? 'default'}>
											{t(
												item.status === 'AVAILABLE'
													? 'available'
													: item.status === 'RESERVED'
														? 'reserved'
														: 'donated',
											)}
										</Badge>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	);
}
