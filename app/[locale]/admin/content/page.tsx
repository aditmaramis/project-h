import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { adminItemsQuerySchema } from '@/lib/validators/admin';
import { ContentManagementActions } from '@/components/admin/content-management-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

type Props = {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{
		page?: string;
		limit?: string;
		search?: string;
		status?: string;
		categoryId?: string;
		sortBy?: string;
		sortOrder?: string;
	}>;
};

type ItemStatus = 'AVAILABLE' | 'RESERVED' | 'DONATED';
type ItemCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';

function statusLabel(
	t: Awaited<ReturnType<typeof getTranslations>>,
	status: ItemStatus,
) {
	if (status === 'RESERVED') {
		return t('reserved');
	}

	if (status === 'DONATED') {
		return t('donated');
	}

	return t('available');
}

function conditionLabel(
	t: Awaited<ReturnType<typeof getTranslations>>,
	condition: ItemCondition,
) {
	if (condition === 'LIKE_NEW') {
		return t('conditionLikeNew');
	}

	if (condition === 'GOOD') {
		return t('conditionGood');
	}

	if (condition === 'FAIR') {
		return t('conditionFair');
	}

	return t('conditionNew');
}

export default async function AdminContentPage({
	params,
	searchParams,
}: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('Admin');

	const queryParams = await searchParams;
	const parsedQuery = adminItemsQuerySchema.safeParse(queryParams);
	const query = parsedQuery.success
		? parsedQuery.data
		: adminItemsQuerySchema.parse({});

	const baseWhere: Prisma.ItemWhereInput = {};

	if (query.search) {
		baseWhere.title = { contains: query.search, mode: 'insensitive' };
	}

	if (query.categoryId) {
		baseWhere.categoryId = query.categoryId;
	}

	const where: Prisma.ItemWhereInput = query.status
		? { ...baseWhere, status: query.status }
		: baseWhere;

	const orderBy: Prisma.ItemOrderByWithRelationInput[] =
		query.sortBy === 'title'
			? [{ title: query.sortOrder }, { createdAt: 'desc' }]
			: [{ createdAt: query.sortOrder }, { id: 'asc' }];

	const skip = (query.page - 1) * query.limit;

	const [categories, items, totalItems, statusGroups] = await Promise.all([
		prisma.category.findMany({
			select: {
				id: true,
				name: true,
			},
			orderBy: { name: 'asc' },
		}),
		prisma.item.findMany({
			where,
			orderBy,
			skip,
			take: query.limit,
			select: {
				id: true,
				title: true,
				status: true,
				condition: true,
				categoryId: true,
				images: true,
				createdAt: true,
				category: {
					select: {
						id: true,
						name: true,
					},
				},
				donor: {
					select: {
						id: true,
						name: true,
						email: true,
						avatarUrl: true,
					},
				},
			},
		}),
		prisma.item.count({ where }),
		prisma.item.groupBy({
			by: ['status'],
			where: baseWhere,
			_count: {
				status: true,
			},
		}),
	]);

	const statusCounts: Record<ItemStatus, number> = {
		AVAILABLE: 0,
		RESERVED: 0,
		DONATED: 0,
	};

	for (const group of statusGroups) {
		statusCounts[group.status as ItemStatus] = group._count.status;
	}

	const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));
	const startItem = totalItems === 0 ? 0 : (query.page - 1) * query.limit + 1;
	const endItem = Math.min(query.page * query.limit, totalItems);

	function buildHref(overrides: {
		page?: number;
		search?: string;
		status?: ItemStatus | 'ALL';
		categoryId?: string | 'ALL';
		sortBy?: 'createdAt' | 'title';
		sortOrder?: 'asc' | 'desc';
	}) {
		const params = new URLSearchParams();
		const nextSearch =
			overrides.search !== undefined ? overrides.search : query.search;
		const nextStatus = overrides.status ?? query.status ?? 'ALL';
		const nextCategoryId = overrides.categoryId ?? query.categoryId ?? 'ALL';
		const nextSortBy = overrides.sortBy ?? query.sortBy;
		const nextSortOrder = overrides.sortOrder ?? query.sortOrder;
		const nextPage = overrides.page ?? query.page;

		if (nextSearch) {
			params.set('search', nextSearch);
		}

		if (nextStatus !== 'ALL') {
			params.set('status', nextStatus);
		}

		if (nextCategoryId !== 'ALL') {
			params.set('categoryId', nextCategoryId);
		}

		params.set('sortBy', nextSortBy);
		params.set('sortOrder', nextSortOrder);
		params.set('page', String(nextPage));
		params.set('limit', String(query.limit));

		const value = params.toString();
		return value.length > 0 ? `/admin/content?${value}` : '/admin/content';
	}

	return (
		<>
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 h-4"
				/>
				<h1 className="text-lg font-semibold">{t('content')}</h1>
			</header>

			<div className="flex-1 space-y-4 p-4 md:p-6">
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								{t('totalItems')}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold tabular-nums">{totalItems}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								{t('available')}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold tabular-nums">
								{statusCounts.AVAILABLE}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								{t('reserved')}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold tabular-nums">
								{statusCounts.RESERVED}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								{t('showingItems')}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold tabular-nums">
								{startItem}-{endItem}
							</p>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">{t('contentFilters')}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<form className="flex flex-col gap-2 sm:flex-row">
							<Input
								name="search"
								defaultValue={query.search ?? ''}
								placeholder={t('contentSearchPlaceholder')}
							/>
							<input
								type="hidden"
								name="status"
								value={query.status ?? ''}
							/>
							<input
								type="hidden"
								name="categoryId"
								value={query.categoryId ?? ''}
							/>
							<input
								type="hidden"
								name="sortBy"
								value={query.sortBy}
							/>
							<input
								type="hidden"
								name="sortOrder"
								value={query.sortOrder}
							/>
							<input
								type="hidden"
								name="limit"
								value={query.limit}
							/>
							<Button type="submit">{t('searchItems')}</Button>
							<Button
								render={<Link href="/admin/content" />}
								nativeButton={false}
								variant="outline"
							>
								{t('clearFilters')}
							</Button>
						</form>

						<div className="grid gap-3 lg:grid-cols-3">
							<div className="space-y-2">
								<p className="text-sm font-medium">{t('filterByStatus')}</p>
								<div className="flex flex-wrap gap-2">
									{(['ALL', 'AVAILABLE', 'RESERVED', 'DONATED'] as const).map(
										(status) => {
											const currentStatus = query.status ?? 'ALL';
											const label =
												status === 'ALL' ? t('all') : statusLabel(t, status);
											const count =
												status === 'ALL'
													? statusCounts.AVAILABLE +
														statusCounts.RESERVED +
														statusCounts.DONATED
													: statusCounts[status];
											return (
												<Button
													key={status}
													render={
														<Link
															href={buildHref({
																status,
																page: 1,
															})}
														/>
													}
													nativeButton={false}
													size="sm"
													variant={
														currentStatus === status ? 'default' : 'outline'
													}
												>
													{label}
													<Badge
														variant="secondary"
														className="ml-1"
													>
														{count}
													</Badge>
												</Button>
											);
										},
									)}
								</div>
							</div>

							<div className="space-y-2">
								<p className="text-sm font-medium">{t('filterByCategory')}</p>
								<div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
									<Button
										render={
											<Link
												href={buildHref({
													categoryId: 'ALL',
													page: 1,
												})}
											/>
										}
										nativeButton={false}
										size="sm"
										variant={!query.categoryId ? 'default' : 'outline'}
									>
										{t('all')}
									</Button>
									{categories.map((category) => (
										<Button
											key={category.id}
											render={
												<Link
													href={buildHref({
														categoryId: category.id,
														page: 1,
													})}
												/>
											}
											nativeButton={false}
											size="sm"
											variant={
												query.categoryId === category.id ? 'default' : 'outline'
											}
										>
											{category.name}
										</Button>
									))}
								</div>
							</div>

							<div className="space-y-2">
								<p className="text-sm font-medium">{t('sortBy')}</p>
								<div className="flex flex-wrap gap-2">
									{[
										{
											key: 'createdAt-desc',
											label: t('sortNewest'),
											sortBy: 'createdAt',
											sortOrder: 'desc',
										},
										{
											key: 'createdAt-asc',
											label: t('sortOldest'),
											sortBy: 'createdAt',
											sortOrder: 'asc',
										},
										{
											key: 'title-asc',
											label: t('sortTitleAsc'),
											sortBy: 'title',
											sortOrder: 'asc',
										},
										{
											key: 'title-desc',
											label: t('sortTitleDesc'),
											sortBy: 'title',
											sortOrder: 'desc',
										},
									].map((sortOption) => {
										const isActive =
											query.sortBy === sortOption.sortBy &&
											query.sortOrder === sortOption.sortOrder;
										return (
											<Button
												key={sortOption.key}
												render={
													<Link
														href={buildHref({
															sortBy: sortOption.sortBy as
																| 'createdAt'
																| 'title',
															sortOrder: sortOption.sortOrder as 'asc' | 'desc',
															page: 1,
														})}
													/>
												}
												nativeButton={false}
												size="sm"
												variant={isActive ? 'default' : 'outline'}
											>
												{sortOption.label}
											</Button>
										);
									})}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-0">
						{items.length === 0 ? (
							<p className="p-6 text-sm text-muted-foreground">
								{t('noItemsFound')}
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t('itemTitle')}</TableHead>
										<TableHead>{t('donor')}</TableHead>
										<TableHead>{t('category')}</TableHead>
										<TableHead>{t('status')}</TableHead>
										<TableHead>{t('condition')}</TableHead>
										<TableHead>{t('createdAt')}</TableHead>
										<TableHead className="text-right">{t('actions')}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map((item) => (
										<TableRow key={item.id}>
											<TableCell>
												<div className="grid gap-0.5">
													<p className="font-medium">{item.title}</p>
													<p className="text-xs text-muted-foreground">
														{t('itemIdLabel', { id: item.id })}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<div className="grid gap-0.5">
													<p>{item.donor.name ?? t('anonymousUser')}</p>
													<p className="text-xs text-muted-foreground">
														{item.donor.email}
													</p>
												</div>
											</TableCell>
											<TableCell>{item.category.name}</TableCell>
											<TableCell>
												<Badge
													variant={
														item.status === 'DONATED'
															? 'default'
															: item.status === 'RESERVED'
																? 'outline'
																: 'secondary'
													}
												>
													{statusLabel(t, item.status as ItemStatus)}
												</Badge>
											</TableCell>
											<TableCell>
												{conditionLabel(t, item.condition as ItemCondition)}
											</TableCell>
											<TableCell>
												{new Date(item.createdAt).toLocaleDateString(locale, {
													year: 'numeric',
													month: 'short',
													day: 'numeric',
												})}
											</TableCell>
											<TableCell className="text-right">
												<ContentManagementActions
													item={{
														id: item.id,
														title: item.title,
														status: item.status as ItemStatus,
														condition: item.condition as ItemCondition,
														categoryId: item.category.id,
														categoryName: item.category.name,
														donor: {
															id: item.donor.id,
															name: item.donor.name,
															email: item.donor.email,
															avatarUrl: item.donor.avatarUrl,
														},
														images: item.images,
														createdAt: item.createdAt,
													}}
													categories={categories}
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
					<p className="text-sm text-muted-foreground">
						{t('contentPaginationSummary', {
							start: startItem,
							end: endItem,
							total: totalItems,
						})}
					</p>
					<div className="flex items-center gap-2">
						<Button
							render={
								<Link href={buildHref({ page: Math.max(1, query.page - 1) })} />
							}
							nativeButton={false}
							variant="outline"
							disabled={query.page <= 1}
						>
							{t('previous')}
						</Button>
						<p className="min-w-20 text-center text-sm">
							{t('pageOf', { page: query.page, totalPages })}
						</p>
						<Button
							render={
								<Link
									href={buildHref({
										page: Math.min(totalPages, query.page + 1),
									})}
								/>
							}
							nativeButton={false}
							variant="outline"
							disabled={query.page >= totalPages}
						>
							{t('next')}
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
