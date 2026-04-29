import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { adminUsersQuerySchema } from '@/lib/validators/admin';
import { UserBulkActions } from '@/components/admin/user-bulk-actions';
import { UserManagementActions } from '@/components/admin/user-management-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
		role?: string;
		banStatus?: string;
		sortBy?: string;
		sortOrder?: string;
	}>;
};

export default async function AdminUsersPage({ params, searchParams }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('Admin');

	const queryParams = await searchParams;
	const parsedQuery = adminUsersQuerySchema.safeParse(queryParams);
	const query = parsedQuery.success
		? parsedQuery.data
		: adminUsersQuerySchema.parse({});

	const where: Prisma.ProfileWhereInput = {};

	if (query.search) {
		where.OR = [
			{ name: { contains: query.search, mode: 'insensitive' } },
			{ email: { contains: query.search, mode: 'insensitive' } },
		];
	}

	if (query.role) {
		where.role = query.role;
	}

	if (query.banStatus === 'ACTIVE') {
		where.isBanned = false;
	}

	if (query.banStatus === 'BANNED') {
		where.isBanned = true;
	}

	const orderBy: Prisma.ProfileOrderByWithRelationInput[] =
		query.sortBy === 'name'
			? [{ name: query.sortOrder }, { createdAt: 'desc' }]
			: [{ createdAt: query.sortOrder }, { id: 'asc' }];

	const skip = (query.page - 1) * query.limit;

	const supabase = await createClient();
	const {
		data: { user: currentUser },
	} = await supabase.auth.getUser();

	const [users, totalUsers, totalAdmins, totalBanned] = await Promise.all([
		prisma.profile.findMany({
			where,
			orderBy,
			skip,
			take: query.limit,
			select: {
				id: true,
				name: true,
				email: true,
				avatarUrl: true,
				role: true,
				isBanned: true,
				bannedAt: true,
				bannedReason: true,
				accountType: true,
				isVerified: true,
				createdAt: true,
			},
		}),
		prisma.profile.count({ where }),
		prisma.profile.count({ where: { role: 'ADMIN' } }),
		prisma.profile.count({ where: { isBanned: true } }),
	]);

	const totalPages = Math.max(1, Math.ceil(totalUsers / query.limit));
	const startItem = totalUsers === 0 ? 0 : (query.page - 1) * query.limit + 1;
	const endItem = Math.min(query.page * query.limit, totalUsers);

	function buildHref(overrides: {
		page?: number;
		search?: string;
		role?: 'USER' | 'ADMIN' | 'ALL';
		banStatus?: 'ACTIVE' | 'BANNED' | 'ALL';
		sortBy?: 'createdAt' | 'name';
		sortOrder?: 'asc' | 'desc';
	}) {
		const params = new URLSearchParams();
		const nextSearch =
			overrides.search !== undefined ? overrides.search : query.search;
		const nextRole = overrides.role ?? query.role ?? 'ALL';
		const nextBanStatus = overrides.banStatus ?? query.banStatus ?? 'ALL';
		const nextSortBy = overrides.sortBy ?? query.sortBy;
		const nextSortOrder = overrides.sortOrder ?? query.sortOrder;
		const nextPage = overrides.page ?? query.page;

		if (nextSearch) {
			params.set('search', nextSearch);
		}

		if (nextRole !== 'ALL') {
			params.set('role', nextRole);
		}

		if (nextBanStatus !== 'ALL') {
			params.set('banStatus', nextBanStatus);
		}

		params.set('sortBy', nextSortBy);
		params.set('sortOrder', nextSortOrder);
		params.set('page', String(nextPage));
		params.set('limit', String(query.limit));

		const value = params.toString();
		return value.length > 0 ? `/admin/users?${value}` : '/admin/users';
	}

	return (
		<>
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 h-4"
				/>
				<h1 className="text-lg font-semibold">{t('users')}</h1>
			</header>

			<div className="flex-1 space-y-4 p-4 md:p-6">
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								{t('totalUsers')}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold tabular-nums">{totalUsers}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								{t('adminsCount')}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold tabular-nums">{totalAdmins}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								{t('bannedUsersCount')}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold tabular-nums">{totalBanned}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								{t('showingResults')}
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
						<CardTitle className="text-base">{t('userFilters')}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<form className="flex flex-col gap-2 sm:flex-row">
							<Input
								name="search"
								defaultValue={query.search ?? ''}
								placeholder={t('userSearchPlaceholder')}
							/>
							<input
								type="hidden"
								name="role"
								value={query.role ?? ''}
							/>
							<input
								type="hidden"
								name="banStatus"
								value={query.banStatus ?? ''}
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
							<Button type="submit">{t('searchUsers')}</Button>
							<Button
								render={<Link href="/admin/users" />}
								nativeButton={false}
								variant="outline"
							>
								{t('clearFilters')}
							</Button>
						</form>

						<div className="grid gap-3 lg:grid-cols-3">
							<div className="space-y-2">
								<p className="text-sm font-medium">{t('filterByRole')}</p>
								<div className="flex flex-wrap gap-2">
									{(['ALL', 'USER', 'ADMIN'] as const).map((role) => {
										const currentRole = query.role ?? 'ALL';
										return (
											<Button
												key={role}
												render={
													<Link
														href={buildHref({
															role,
															page: 1,
														})}
													/>
												}
												nativeButton={false}
												size="sm"
												variant={currentRole === role ? 'default' : 'outline'}
											>
												{role === 'ALL'
													? t('all')
													: role === 'ADMIN'
														? t('roleAdmin')
														: t('roleUser')}
											</Button>
										);
									})}
								</div>
							</div>

							<div className="space-y-2">
								<p className="text-sm font-medium">{t('filterByStatus')}</p>
								<div className="flex flex-wrap gap-2">
									{(['ALL', 'ACTIVE', 'BANNED'] as const).map((status) => {
										const currentStatus = query.banStatus ?? 'ALL';
										return (
											<Button
												key={status}
												render={
													<Link
														href={buildHref({
															banStatus: status,
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
												{status === 'ALL'
													? t('all')
													: status === 'BANNED'
														? t('statusBanned')
														: t('statusActive')}
											</Button>
										);
									})}
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
											key: 'name-asc',
											label: t('sortNameAsc'),
											sortBy: 'name',
											sortOrder: 'asc',
										},
										{
											key: 'name-desc',
											label: t('sortNameDesc'),
											sortBy: 'name',
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
															sortBy: sortOption.sortBy as 'createdAt' | 'name',
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
					<CardContent className="py-4">
						<UserBulkActions
							users={users.map((profile) => ({
								id: profile.id,
								isBanned: profile.isBanned,
							}))}
							currentAdminId={currentUser?.id}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-0">
						{users.length === 0 ? (
							<p className="p-6 text-sm text-muted-foreground">
								{t('noUsersFound')}
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t('name')}</TableHead>
										<TableHead>{t('email')}</TableHead>
										<TableHead>{t('role')}</TableHead>
										<TableHead>{t('status')}</TableHead>
										<TableHead>{t('joinedDate')}</TableHead>
										<TableHead className="text-right">{t('actions')}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{users.map((profile) => (
										<TableRow
											key={profile.id}
											data-testid="admin-user-row"
											data-user-id={profile.id}
											data-user-email={profile.email}
										>
											<TableCell>
												<div className="flex items-center gap-2">
													<Avatar className="size-8">
														<AvatarImage
															src={profile.avatarUrl ?? undefined}
															alt={profile.name ?? profile.email}
														/>
														<AvatarFallback>
															{(profile.name ?? profile.email)
																.charAt(0)
																.toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<span className="font-medium">
														{profile.name ?? t('anonymousUser')}
													</span>
												</div>
											</TableCell>
											<TableCell>{profile.email}</TableCell>
											<TableCell>
												<Badge
													data-testid="admin-user-role-badge"
													data-role={profile.role}
													variant={
														profile.role === 'ADMIN' ? 'default' : 'secondary'
													}
												>
													{profile.role === 'ADMIN'
														? t('roleAdmin')
														: t('roleUser')}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge
													data-testid="admin-user-status-badge"
													data-status={profile.isBanned ? 'BANNED' : 'ACTIVE'}
													variant={
														profile.isBanned ? 'destructive' : 'secondary'
													}
												>
													{profile.isBanned
														? t('statusBanned')
														: t('statusActive')}
												</Badge>
											</TableCell>
											<TableCell>
												{new Date(profile.createdAt).toLocaleDateString(
													locale,
													{
														year: 'numeric',
														month: 'short',
														day: 'numeric',
													},
												)}
											</TableCell>
											<TableCell className="text-right">
												<UserManagementActions
													user={profile}
													isCurrentAdmin={currentUser?.id === profile.id}
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
						{t('paginationSummary', {
							start: startItem,
							end: endItem,
							total: totalUsers,
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
