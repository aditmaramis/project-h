'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';

type ActionType = 'BAN' | 'UNBAN' | 'WARN' | 'SET_ROLE';

type UserSummary = {
	id: string;
	name: string | null;
	email: string;
	avatarUrl: string | null;
	role: 'USER' | 'ADMIN';
	isBanned: boolean;
	bannedReason: string | null;
	createdAt: Date;
	accountType: 'PERSONAL' | 'ORGANIZATION';
	isVerified: boolean;
};

type UserDetailsResponse = {
	user: {
		id: string;
		name: string | null;
		email: string;
		avatarUrl: string | null;
		role: 'USER' | 'ADMIN';
		isBanned: boolean;
		bannedAt: string | null;
		bannedReason: string | null;
		createdAt: string;
		updatedAt: string;
		accountType: 'PERSONAL' | 'ORGANIZATION';
		isVerified: boolean;
		verifiedAt: string | null;
		bio: string | null;
		district: string | null;
		region: string | null;
		country: string | null;
	};
	stats: {
		totalItems: number;
		activeItems: number;
		reservedItems: number;
		donatedItems: number;
		reportsSubmitted: number;
		conversationCount: number;
	};
	recentActions: Array<{
		id: string;
		actionType: string;
		details: string | null;
		createdAt: string;
		admin: {
			id: string;
			name: string | null;
			avatarUrl: string | null;
		};
	}>;
};

export function UserManagementActions({
	user,
	isCurrentAdmin,
}: {
	user: UserSummary;
	isCurrentAdmin: boolean;
}) {
	const t = useTranslations('Admin');
	const locale = useLocale();
	const router = useRouter();

	const [sheetOpen, setSheetOpen] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [action, setAction] = useState<ActionType | null>(null);
	const [reason, setReason] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [detailsLoading, setDetailsLoading] = useState(false);
	const [detailsError, setDetailsError] = useState<string | null>(null);
	const [details, setDetails] = useState<UserDetailsResponse | null>(null);

	const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
	const requiresReason = action === 'BAN' || action === 'WARN';

	function openActionDialog(nextAction: ActionType) {
		setAction(nextAction);
		setReason('');
		setError(null);
		setDialogOpen(true);
	}

	function closeActionDialog() {
		if (loading) {
			return;
		}

		setDialogOpen(false);
		setAction(null);
		setReason('');
		setError(null);
	}

	function dialogTitle() {
		if (action === 'BAN') {
			return t('banUser');
		}

		if (action === 'UNBAN') {
			return t('unbanUser');
		}

		if (action === 'WARN') {
			return t('warnUser');
		}

		if (nextRole === 'ADMIN') {
			return t('promoteToAdmin');
		}

		return t('demoteToUser');
	}

	function dialogDescription() {
		const displayName = user.name ?? user.email;

		if (action === 'BAN') {
			return t('banUserDescription', { name: displayName });
		}

		if (action === 'UNBAN') {
			return t('unbanUserDescription', { name: displayName });
		}

		if (action === 'WARN') {
			return t('warnUserDescription', { name: displayName });
		}

		if (nextRole === 'ADMIN') {
			return t('promoteUserDescription', { name: displayName });
		}

		return t('demoteUserDescription', { name: displayName });
	}

	function resolveActionError(errorMessage: string | undefined) {
		if (errorMessage === 'Cannot ban your own account') {
			return t('cannotBanSelf');
		}

		if (errorMessage === 'Cannot demote your own account') {
			return t('cannotDemoteSelf');
		}

		return t('userActionError');
	}

	function getActionLabel(actionType: string, detailsValue: string | null) {
		if (actionType === 'WARN_USER' && detailsValue) {
			try {
				const parsed = JSON.parse(detailsValue) as { kind?: string };
				if (parsed.kind === 'PROMOTE_USER') {
					return t('actionPromoteUser');
				}
				if (parsed.kind === 'DEMOTE_USER') {
					return t('actionDemoteUser');
				}
			} catch {
				// Ignore invalid JSON and fall back to the default mapping.
			}
		}

		const actionLabels: Record<string, string> = {
			BAN_USER: t('actionBanUser'),
			UNBAN_USER: t('actionUnbanUser'),
			WARN_USER: t('actionWarnUser'),
			PROMOTE_USER: t('actionPromoteUser'),
			DEMOTE_USER: t('actionDemoteUser'),
			DELETE_ITEM: t('actionDeleteItem'),
			EDIT_ITEM: t('actionEditItem'),
			RESOLVE_REPORT: t('actionResolveReport'),
			DISMISS_REPORT: t('actionDismissReport'),
			ADD_KEYWORD: t('actionAddKeyword'),
			REMOVE_KEYWORD: t('actionRemoveKeyword'),
		};

		return actionLabels[actionType] ?? actionType;
	}

	useEffect(() => {
		if (!sheetOpen) {
			return;
		}

		const controller = new AbortController();

		async function loadDetails() {
			setDetailsLoading(true);
			setDetailsError(null);
			setDetails(null);

			const res = await fetch(`/api/admin/users/${user.id}`, {
				signal: controller.signal,
			});

			if (!res.ok) {
				setDetailsLoading(false);
				setDetailsError(t('userDetailsLoadError'));
				return;
			}

			const data = (await res.json()) as UserDetailsResponse;
			setDetails(data);
			setDetailsLoading(false);
		}

		loadDetails().catch((fetchError) => {
			if ((fetchError as { name?: string }).name === 'AbortError') {
				return;
			}

			setDetailsLoading(false);
			setDetailsError(t('userDetailsLoadError'));
		});

		return () => {
			controller.abort();
		};
	}, [sheetOpen, user.id, t]);

	async function handleSubmitAction() {
		if (!action || loading) {
			return;
		}

		const trimmedReason = reason.trim();
		if (requiresReason && !trimmedReason) {
			setError(t('reasonRequired'));
			return;
		}

		setLoading(true);
		setError(null);

		const payload: {
			action: ActionType;
			reason?: string;
			role?: 'USER' | 'ADMIN';
		} = {
			action,
		};

		if (action === 'BAN' || action === 'WARN') {
			payload.reason = trimmedReason;
		}

		if (action === 'SET_ROLE') {
			payload.role = nextRole;
		}

		const res = await fetch(`/api/admin/users/${user.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		setLoading(false);

		if (!res.ok) {
			const data = (await res.json().catch(() => null)) as {
				error?: string;
			} | null;
			setError(resolveActionError(data?.error));
			return;
		}

		closeActionDialog();
		setSheetOpen(false);
		router.refresh();
	}

	return (
		<>
			<Button
				data-testid="admin-user-manage-button"
				size="sm"
				variant="outline"
				onClick={() => setSheetOpen(true)}
			>
				{t('manageUser')}
			</Button>

			<Sheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			>
				<SheetContent
					data-testid="admin-user-details-sheet"
					side="right"
					className="w-full sm:max-w-md"
				>
					<SheetHeader>
						<SheetTitle>{t('userDetails')}</SheetTitle>
						<SheetDescription>{t('userDetailsDescription')}</SheetDescription>
					</SheetHeader>

					<div className="space-y-5 px-4 pb-4">
						<div className="flex items-start gap-3">
							<Avatar className="size-10">
								<AvatarImage
									src={user.avatarUrl ?? undefined}
									alt={user.name ?? user.email}
								/>
								<AvatarFallback>
									{(user.name ?? user.email).charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">
									{user.name ?? t('anonymousUser')}
								</p>
								<p className="truncate text-sm text-muted-foreground">
									{user.email}
								</p>
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							<Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
								{user.role === 'ADMIN' ? t('roleAdmin') : t('roleUser')}
							</Badge>
							<Badge variant={user.isBanned ? 'destructive' : 'secondary'}>
								{user.isBanned ? t('statusBanned') : t('statusActive')}
							</Badge>
							<Badge variant="outline">
								{user.accountType === 'ORGANIZATION'
									? t('accountOrganization')
									: t('accountPersonal')}
							</Badge>
							{user.isVerified ? (
								<Badge variant="secondary">{t('verified')}</Badge>
							) : null}
						</div>

						<div className="space-y-1 text-sm">
							<p>
								<span className="text-muted-foreground">
									{t('joinedDateLabel')}:
								</span>{' '}
								{new Date(user.createdAt).toLocaleDateString(locale, {
									year: 'numeric',
									month: 'short',
									day: 'numeric',
								})}
							</p>
							{user.bannedReason ? (
								<p>
									<span className="text-muted-foreground">
										{t('banReasonLabel')}:
									</span>{' '}
									{user.bannedReason}
								</p>
							) : null}
						</div>

						{detailsLoading ? (
							<p className="text-sm text-muted-foreground">
								{t('loadingUserDetails')}
							</p>
						) : null}

						{detailsError ? (
							<p className="text-sm text-destructive">{detailsError}</p>
						) : null}

						{details ? (
							<>
								<div className="space-y-1 text-sm">
									<p className="font-medium">{t('userBioLabel')}</p>
									<p className="text-muted-foreground">
										{details.user.bio?.trim() || t('userBioEmpty')}
									</p>
								</div>

								<div className="space-y-1 text-sm">
									<p>
										<span className="text-muted-foreground">
											{t('userLocationLabel')}:
										</span>{' '}
										{[
											details.user.district,
											details.user.region,
											details.user.country,
										]
											.filter(Boolean)
											.join(', ') || t('userLocationUnknown')}
									</p>
									<p>
										<span className="text-muted-foreground">
											{t('profileUpdatedAtLabel')}:
										</span>{' '}
										{new Date(details.user.updatedAt).toLocaleDateString(
											locale,
											{
												year: 'numeric',
												month: 'short',
												day: 'numeric',
											},
										)}
									</p>
									{details.user.verifiedAt ? (
										<p>
											<span className="text-muted-foreground">
												{t('verifiedAtLabel')}:
											</span>{' '}
											{new Date(details.user.verifiedAt).toLocaleDateString(
												locale,
												{
													year: 'numeric',
													month: 'short',
													day: 'numeric',
												},
											)}
										</p>
									) : null}
								</div>

								<div className="space-y-2 text-sm">
									<p className="font-medium">{t('moderationStats')}</p>
									<div className="grid grid-cols-2 gap-2 text-muted-foreground">
										<p>
											{t('statTotalItems')}: {details.stats.totalItems}
										</p>
										<p>
											{t('statActiveItems')}: {details.stats.activeItems}
										</p>
										<p>
											{t('statReservedItems')}: {details.stats.reservedItems}
										</p>
										<p>
											{t('statDonatedItems')}: {details.stats.donatedItems}
										</p>
										<p>
											{t('statReportsSubmitted')}:{' '}
											{details.stats.reportsSubmitted}
										</p>
										<p>
											{t('statConversations')}:{' '}
											{details.stats.conversationCount}
										</p>
									</div>
								</div>

								<div className="space-y-2 text-sm">
									<p className="font-medium">{t('recentModerationEvents')}</p>
									{details.recentActions.length === 0 ? (
										<p className="text-muted-foreground">
											{t('noModerationEvents')}
										</p>
									) : (
										<div className="space-y-2">
											{details.recentActions.map((entry) => (
												<p
													key={entry.id}
													className="text-muted-foreground"
												>
													{getActionLabel(entry.actionType, entry.details)} -{' '}
													{new Date(entry.createdAt).toLocaleDateString(
														locale,
														{
															month: 'short',
															day: 'numeric',
															year: 'numeric',
														},
													)}
												</p>
											))}
										</div>
									)}
								</div>
							</>
						) : null}

						<div className="grid gap-2">
							<Button
								data-testid="admin-user-warn"
								variant="outline"
								onClick={() => openActionDialog('WARN')}
							>
								{t('warnUser')}
							</Button>
							<Button
								data-testid="admin-user-ban-toggle"
								variant={user.isBanned ? 'secondary' : 'destructive'}
								onClick={() =>
									openActionDialog(user.isBanned ? 'UNBAN' : 'BAN')
								}
								disabled={isCurrentAdmin && !user.isBanned}
							>
								{user.isBanned ? t('unbanUser') : t('banUser')}
							</Button>
							<Button
								data-testid="admin-user-role-toggle"
								variant="outline"
								onClick={() => openActionDialog('SET_ROLE')}
								disabled={isCurrentAdmin && nextRole === 'USER'}
							>
								{nextRole === 'ADMIN' ? t('promoteToAdmin') : t('demoteToUser')}
							</Button>
						</div>
					</div>
				</SheetContent>
			</Sheet>

			<Dialog
				open={dialogOpen}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) {
						closeActionDialog();
					}
				}}
			>
				<DialogContent data-testid="admin-user-action-dialog">
					<DialogHeader>
						<DialogTitle>{dialogTitle()}</DialogTitle>
						<DialogDescription>{dialogDescription()}</DialogDescription>
					</DialogHeader>

					{requiresReason ? (
						<div className="grid gap-2">
							<p className="text-sm font-medium">{t('reason')}</p>
							<Input
								data-testid="admin-user-action-reason"
								value={reason}
								onChange={(event) => setReason(event.target.value)}
								placeholder={t('reasonPlaceholder')}
							/>
						</div>
					) : null}

					{error ? (
						<p
							data-testid="admin-user-action-error"
							className="text-sm text-destructive"
						>
							{error}
						</p>
					) : null}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={closeActionDialog}
						>
							{t('cancel')}
						</Button>
						<Button
							data-testid="admin-user-action-confirm"
							variant={action === 'BAN' ? 'destructive' : 'default'}
							onClick={handleSubmitAction}
							disabled={loading}
						>
							{loading ? t('saving') : t('confirmAction')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
