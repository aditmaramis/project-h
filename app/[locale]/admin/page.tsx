import { setRequestLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	Users,
	Package,
	UserPlus,
	PackagePlus,
	Flag,
	MessageSquare,
	TrendingUp,
	TrendingDown,
	Minus,
} from 'lucide-react';
import { AdminOverviewCharts } from '@/components/admin/overview-charts';

type Props = {
	params: Promise<{ locale: string }>;
};

export default async function AdminOverviewPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('Admin');

	// Date boundaries
	const now = new Date();
	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	);
	const startOfWeek = new Date(startOfToday);
	startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

	// Parallel queries — no waterfalls
	const [
		totalUsers,
		newUsersToday,
		newUsersThisWeek,
		newUsersThisMonth,
		newUsersLastMonth,
		totalItems,
		newItemsToday,
		newItemsThisWeek,
		newItemsThisMonth,
		newItemsLastMonth,
		itemsByStatusRaw,
		totalConversations,
		pendingReports,
		recentActions,
		signupsByDay,
		itemsByDay,
	] = await Promise.all([
		prisma.profile.count(),
		prisma.profile.count({
			where: { createdAt: { gte: startOfToday } },
		}),
		prisma.profile.count({
			where: { createdAt: { gte: startOfWeek } },
		}),
		prisma.profile.count({
			where: { createdAt: { gte: startOfMonth } },
		}),
		prisma.profile.count({
			where: {
				createdAt: { gte: startOfLastMonth, lt: startOfMonth },
			},
		}),
		prisma.item.count(),
		prisma.item.count({
			where: { createdAt: { gte: startOfToday } },
		}),
		prisma.item.count({
			where: { createdAt: { gte: startOfWeek } },
		}),
		prisma.item.count({
			where: { createdAt: { gte: startOfMonth } },
		}),
		prisma.item.count({
			where: {
				createdAt: { gte: startOfLastMonth, lt: startOfMonth },
			},
		}),
		prisma.item.groupBy({
			by: ['status'],
			_count: { status: true },
		}),
		prisma.conversation.count(),
		prisma.report.count({
			where: { status: 'PENDING' },
		}),
		prisma.adminAction.findMany({
			take: 8,
			orderBy: { createdAt: 'desc' },
			include: {
				admin: { select: { id: true, name: true, avatarUrl: true } },
			},
		}),
		prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
			`SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
			 FROM profiles
			 WHERE "createdAt" >= $1
			 GROUP BY DATE("createdAt")
			 ORDER BY date ASC`,
			new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
		),
		prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
			`SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
			 FROM items
			 WHERE "createdAt" >= $1
			 GROUP BY DATE("createdAt")
			 ORDER BY date ASC`,
			new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
		),
	]);

	// Process data
	const itemsByStatus = Object.fromEntries(
		itemsByStatusRaw.map((i) => [i.status, i._count.status]),
	);

	const userGrowthPct =
		newUsersLastMonth > 0
			? Math.round(
					((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100,
				)
			: newUsersThisMonth > 0
				? 100
				: 0;

	const itemGrowthPct =
		newItemsLastMonth > 0
			? Math.round(
					((newItemsThisMonth - newItemsLastMonth) / newItemsLastMonth) * 100,
				)
			: newItemsThisMonth > 0
				? 100
				: 0;

	const signupsTimeline = signupsByDay.map((row) => ({
		date: String(row.date).slice(0, 10),
		count: Number(row.count),
	}));

	const itemsTimeline = itemsByDay.map((row) => ({
		date: String(row.date).slice(0, 10),
		count: Number(row.count),
	}));

	// Action type label mapping
	const actionLabels: Record<string, string> = {
		BAN_USER: t('actionBanUser'),
		UNBAN_USER: t('actionUnbanUser'),
		WARN_USER: t('actionWarnUser'),
		DELETE_ITEM: t('actionDeleteItem'),
		EDIT_ITEM: t('actionEditItem'),
		RESOLVE_REPORT: t('actionResolveReport'),
		DISMISS_REPORT: t('actionDismissReport'),
		ADD_KEYWORD: t('actionAddKeyword'),
		REMOVE_KEYWORD: t('actionRemoveKeyword'),
	};

	function TrendIcon({ value }: { value: number }) {
		if (value > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
		if (value < 0) return <TrendingDown className="size-3.5 text-red-500" />;
		return <Minus className="size-3.5 text-muted-foreground" />;
	}

	return (
		<>
			{/* Header */}
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 h-4"
				/>
				<h1 className="text-lg font-semibold">{t('overview')}</h1>
			</header>

			<div className="flex-1 space-y-6 p-6">
				{/* ─── Metric Cards Row ────────────────────────── */}
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
					{/* Total Users */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardDescription className="text-sm font-medium">
								{t('totalUsers')}
							</CardDescription>
							<Users className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{totalUsers.toLocaleString()}
							</div>
							<div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
								<TrendIcon value={userGrowthPct} />
								<span
									className={
										userGrowthPct > 0
											? 'text-emerald-600'
											: userGrowthPct < 0
												? 'text-red-500'
												: ''
									}
								>
									{userGrowthPct > 0 ? '+' : ''}
									{userGrowthPct}%
								</span>
								<span>{t('thisMonth')}</span>
							</div>
						</CardContent>
					</Card>

					{/* New Signups */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardDescription className="text-sm font-medium">
								{t('newSignups')}
							</CardDescription>
							<UserPlus className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{newUsersThisMonth}</div>
							<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
								<span>
									{t('today')}: {newUsersToday}
								</span>
								<span className="text-border">|</span>
								<span>
									{t('thisWeek')}: {newUsersThisWeek}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Total Items */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardDescription className="text-sm font-medium">
								{t('totalItems')}
							</CardDescription>
							<Package className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{totalItems.toLocaleString()}
							</div>
							<div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
								<TrendIcon value={itemGrowthPct} />
								<span
									className={
										itemGrowthPct > 0
											? 'text-emerald-600'
											: itemGrowthPct < 0
												? 'text-red-500'
												: ''
									}
								>
									{itemGrowthPct > 0 ? '+' : ''}
									{itemGrowthPct}%
								</span>
								<span>{t('thisMonth')}</span>
							</div>
						</CardContent>
					</Card>

					{/* New Items */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardDescription className="text-sm font-medium">
								{t('newItems')}
							</CardDescription>
							<PackagePlus className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{newItemsThisMonth}</div>
							<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
								<span>
									{t('today')}: {newItemsToday}
								</span>
								<span className="text-border">|</span>
								<span>
									{t('thisWeek')}: {newItemsThisWeek}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Pending Reports */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardDescription className="text-sm font-medium">
								{t('pendingReports')}
							</CardDescription>
							<Flag className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{pendingReports}</div>
							<div className="text-xs text-muted-foreground mt-1">
								{pendingReports > 0 ? (
									<Badge
										variant="destructive"
										className="text-xs"
									>
										{pendingReports} pending
									</Badge>
								) : (
									<Badge
										variant="secondary"
										className="text-xs"
									>
										All clear
									</Badge>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Conversations */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardDescription className="text-sm font-medium">
								{t('activeConversations')}
							</CardDescription>
							<MessageSquare className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{totalConversations.toLocaleString()}
							</div>
							<div className="text-xs text-muted-foreground mt-1">
								{t('totalItems')}: {totalItems}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* ─── Charts + Sidebar ─────────────────────────── */}
				<div className="grid gap-6 lg:grid-cols-7">
					{/* Charts Area (5 cols) */}
					<div className="space-y-6 lg:col-span-5">
						<AdminOverviewCharts
							signupsTimeline={signupsTimeline}
							itemsTimeline={itemsTimeline}
							itemsByStatus={{
								available: itemsByStatus['AVAILABLE'] ?? 0,
								reserved: itemsByStatus['RESERVED'] ?? 0,
								donated: itemsByStatus['DONATED'] ?? 0,
							}}
						/>
					</div>

					{/* Recent Actions Sidebar (2 cols) */}
					<div className="lg:col-span-2 space-y-6">
						{/* Items by Status */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">
									{t('itemsByStatus')}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="size-2.5 rounded-full bg-emerald-500" />
										<span className="text-sm">{t('available')}</span>
									</div>
									<span className="text-sm font-medium tabular-nums">
										{itemsByStatus['AVAILABLE'] ?? 0}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="size-2.5 rounded-full bg-amber-500" />
										<span className="text-sm">{t('reserved')}</span>
									</div>
									<span className="text-sm font-medium tabular-nums">
										{itemsByStatus['RESERVED'] ?? 0}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="size-2.5 rounded-full bg-sky-500" />
										<span className="text-sm">{t('donated')}</span>
									</div>
									<span className="text-sm font-medium tabular-nums">
										{itemsByStatus['DONATED'] ?? 0}
									</span>
								</div>
							</CardContent>
						</Card>

						{/* Recent Actions */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">
									{t('recentActions')}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{recentActions.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										{t('noRecentActions')}
									</p>
								) : (
									<div className="space-y-4">
										{recentActions.map((action) => (
											<div
												key={action.id}
												className="flex items-start gap-3"
											>
												<Avatar className="size-7">
													<AvatarImage
														src={action.admin.avatarUrl ?? undefined}
														alt={action.admin.name ?? ''}
													/>
													<AvatarFallback className="text-xs">
														{(action.admin.name ?? 'A').charAt(0).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="min-w-0 flex-1">
													<p className="text-sm leading-tight">
														<span className="font-medium">
															{action.admin.name ?? 'Admin'}
														</span>{' '}
														<span className="text-muted-foreground">
															{actionLabels[action.actionType] ??
																action.actionType}
														</span>
													</p>
													<p className="text-xs text-muted-foreground mt-0.5">
														{new Date(action.createdAt).toLocaleDateString(
															locale,
															{
																month: 'short',
																day: 'numeric',
																hour: '2-digit',
																minute: '2-digit',
															},
														)}
													</p>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</>
	);
}
