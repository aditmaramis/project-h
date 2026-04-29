import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { buildItemHref } from '@/lib/item-url';
import { buildProfileHref } from '@/lib/profile-url';
import { ReportStatusActions } from '@/components/admin/report-status-actions';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED';

const reportStatuses = ['PENDING', 'REVIEWED', 'DISMISSED'] as const;

type Props = {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ status?: string }>;
};

function isReportStatus(value: string | undefined): value is ReportStatus {
	if (!value) {
		return false;
	}

	return reportStatuses.includes(value as ReportStatus);
}

function formatReason(reason: string): string {
	return reason
		.toLowerCase()
		.split(/[_\s-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

export default async function AdminReportsPage({
	params,
	searchParams,
}: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	const query = await searchParams;
	const statusFromQuery = query.status?.toUpperCase();
	const activeStatus: ReportStatus = isReportStatus(statusFromQuery)
		? statusFromQuery
		: 'PENDING';

	const t = await getTranslations('Admin');

	const [statusCountsRaw, reports] = await Promise.all([
		prisma.report.groupBy({
			by: ['status'],
			_count: { status: true },
		}),
		prisma.report.findMany({
			where: { status: activeStatus },
			orderBy: { createdAt: 'desc' },
			include: {
				reporter: {
					select: { id: true, name: true, email: true, avatarUrl: true },
				},
				resolvedBy: {
					select: { id: true, name: true },
				},
			},
		}),
	]);

	const statusCounts: Record<ReportStatus, number> = {
		PENDING: 0,
		REVIEWED: 0,
		DISMISSED: 0,
	};

	for (const row of statusCountsRaw) {
		statusCounts[row.status as ReportStatus] = row._count.status;
	}

	const itemTargetIds = reports
		.filter((report) => report.targetType === 'ITEM')
		.map((report) => report.targetId);

	const profileTargetIds = reports
		.filter((report) => report.targetType === 'PROFILE')
		.map((report) => report.targetId);

	const [targetItems, targetProfiles] = await Promise.all([
		itemTargetIds.length > 0
			? prisma.item.findMany({
					where: { id: { in: itemTargetIds } },
					select: {
						id: true,
						title: true,
						slug: true,
						category: { select: { slug: true } },
					},
				})
			: Promise.resolve([]),
		profileTargetIds.length > 0
			? prisma.profile.findMany({
					where: { id: { in: profileTargetIds } },
					select: { id: true, name: true },
				})
			: Promise.resolve([]),
	]);

	const itemById = new Map(targetItems.map((item) => [item.id, item]));
	const profileById = new Map(
		targetProfiles.map((profile) => [profile.id, profile]),
	);

	function statusLabel(status: ReportStatus): string {
		if (status === 'PENDING') {
			return t('statusPending');
		}

		if (status === 'REVIEWED') {
			return t('statusReviewed');
		}

		return t('statusDismissed');
	}

	return (
		<>
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 h-4"
				/>
				<h1 className="text-lg font-semibold">{t('reportsQueue')}</h1>
			</header>

			<div className="flex-1 space-y-4 p-4 md:p-6">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">{t('reportsFilter')}</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-2">
						{reportStatuses.map((status) => (
							<Button
								key={status}
								render={<Link href={`/admin/reports?status=${status}`} />}
								nativeButton={false}
								size="sm"
								variant={activeStatus === status ? 'default' : 'outline'}
							>
								{statusLabel(status)}
								<Badge
									variant="secondary"
									className="ml-1"
								>
									{statusCounts[status]}
								</Badge>
							</Button>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-0">
						{reports.length === 0 ? (
							<p className="p-6 text-sm text-muted-foreground">
								{t('noReports')}
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t('reporter')}</TableHead>
										<TableHead>{t('target')}</TableHead>
										<TableHead>{t('reason')}</TableHead>
										<TableHead>{t('status')}</TableHead>
										<TableHead>{t('createdAt')}</TableHead>
										<TableHead className="text-right">{t('actions')}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reports.map((report) => {
										const itemTarget =
											report.targetType === 'ITEM'
												? itemById.get(report.targetId)
												: null;
										const profileTarget =
											report.targetType === 'PROFILE'
												? profileById.get(report.targetId)
												: null;

										return (
											<TableRow key={report.id}>
												<TableCell>
													<div className="grid gap-0.5">
														<p className="font-medium">
															{report.reporter.name ?? t('anonymousReporter')}
														</p>
														<p className="text-xs text-muted-foreground">
															{report.reporter.email}
														</p>
													</div>
												</TableCell>
												<TableCell>
													{itemTarget ? (
														<Button
															render={
																<Link
																	href={buildItemHref({
																		categorySlug: itemTarget.category.slug,
																		itemSlug: itemTarget.slug,
																	})}
																/>
															}
															nativeButton={false}
															variant="link"
															className="h-auto px-0"
														>
															{itemTarget.title}
														</Button>
													) : profileTarget ? (
														<Button
															render={
																<Link
																	href={buildProfileHref(
																		profileTarget.id,
																		profileTarget.name,
																	)}
																/>
															}
															nativeButton={false}
															variant="link"
															className="h-auto px-0"
														>
															{profileTarget.name ?? t('anonymousUser')}
														</Button>
													) : (
														<span className="text-xs text-muted-foreground">
															{t('targetUnavailable')}
														</span>
													)}
												</TableCell>
												<TableCell>
													<div className="grid gap-1">
														<p>{formatReason(report.reason)}</p>
														{report.description ? (
															<p className="max-w-72 truncate text-xs text-muted-foreground">
																{report.description}
															</p>
														) : null}
													</div>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															report.status === 'PENDING'
																? 'outline'
																: report.status === 'REVIEWED'
																	? 'secondary'
																	: 'destructive'
														}
													>
														{statusLabel(report.status as ReportStatus)}
													</Badge>
												</TableCell>
												<TableCell className="text-muted-foreground">
													{new Intl.DateTimeFormat(locale, {
														dateStyle: 'medium',
													}).format(report.createdAt)}
												</TableCell>
												<TableCell className="text-right">
													{report.status === 'PENDING' ? (
														<ReportStatusActions reportId={report.id} />
													) : (
														<div className="grid justify-items-end gap-0.5 text-xs text-muted-foreground">
															{report.resolvedAt ? (
																<span>
																	{t('resolvedAtLabel', {
																		date: new Intl.DateTimeFormat(locale, {
																			dateStyle: 'medium',
																		}).format(report.resolvedAt),
																	})}
																</span>
															) : null}
															{report.resolvedBy?.name ? (
																<span>
																	{t('resolvedByLabel', {
																		name: report.resolvedBy.name,
																	})}
																</span>
															) : null}
															{report.adminNote ? (
																<span>{report.adminNote}</span>
															) : null}
														</div>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	);
}
