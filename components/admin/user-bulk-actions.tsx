'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
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

type BulkActionType = 'WARN' | 'BAN' | 'UNBAN';

type BulkUser = {
	id: string;
	isBanned: boolean;
};

export function UserBulkActions({
	users,
	currentAdminId,
}: {
	users: BulkUser[];
	currentAdminId?: string;
}) {
	const t = useTranslations('Admin');
	const router = useRouter();

	const [action, setAction] = useState<BulkActionType | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [reason, setReason] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const targetGroups = useMemo(() => {
		const candidates = users.filter((user) => user.id !== currentAdminId);
		return {
			WARN: candidates.map((user) => user.id),
			BAN: candidates.filter((user) => !user.isBanned).map((user) => user.id),
			UNBAN: candidates.filter((user) => user.isBanned).map((user) => user.id),
		};
	}, [users, currentAdminId]);

	function openDialog(nextAction: BulkActionType) {
		setAction(nextAction);
		setReason('');
		setError(null);
		setDialogOpen(true);
	}

	function closeDialog() {
		if (loading) {
			return;
		}

		setDialogOpen(false);
		setAction(null);
		setReason('');
		setError(null);
	}

	function getDialogTitle() {
		if (action === 'WARN') {
			return t('bulkWarn');
		}

		if (action === 'BAN') {
			return t('bulkBan');
		}

		return t('bulkUnban');
	}

	function getDialogDescription() {
		if (!action) {
			return '';
		}

		return t('bulkActionDescription', {
			action: getDialogTitle(),
			count: targetGroups[action].length,
		});
	}

	async function handleConfirm() {
		if (!action || loading) {
			return;
		}

		const targetIds = targetGroups[action];
		if (targetIds.length === 0) {
			setError(t('bulkNoEligibleUsers'));
			return;
		}

		const trimmedReason = reason.trim();
		if ((action === 'WARN' || action === 'BAN') && !trimmedReason) {
			setError(t('reasonRequired'));
			return;
		}

		setLoading(true);
		setError(null);

		const responses = await Promise.all(
			targetIds.map(async (userId) => {
				const payload:
					| { action: 'WARN'; reason: string }
					| { action: 'BAN'; reason: string }
					| { action: 'UNBAN' } =
					action === 'WARN'
						? { action: 'WARN', reason: trimmedReason }
						: action === 'BAN'
							? { action: 'BAN', reason: trimmedReason }
							: { action: 'UNBAN' };

				const response = await fetch(`/api/admin/users/${userId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});

				return response.ok;
			}),
		);

		setLoading(false);

		const failedCount = responses.filter((ok) => !ok).length;
		if (failedCount > 0) {
			setError(
				t('bulkActionPartialError', {
					failed: failedCount,
					total: targetIds.length,
				}),
			);
			return;
		}

		closeDialog();
		router.refresh();
	}

	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-sm text-muted-foreground">{t('bulkActions')}</p>
				<Button
					data-testid="admin-user-bulk-warn"
					size="sm"
					variant="outline"
					onClick={() => openDialog('WARN')}
					disabled={targetGroups.WARN.length === 0}
				>
					{t('bulkWarn')} ({targetGroups.WARN.length})
				</Button>
				<Button
					data-testid="admin-user-bulk-ban"
					size="sm"
					variant="destructive"
					onClick={() => openDialog('BAN')}
					disabled={targetGroups.BAN.length === 0}
				>
					{t('bulkBan')} ({targetGroups.BAN.length})
				</Button>
				<Button
					data-testid="admin-user-bulk-unban"
					size="sm"
					variant="secondary"
					onClick={() => openDialog('UNBAN')}
					disabled={targetGroups.UNBAN.length === 0}
				>
					{t('bulkUnban')} ({targetGroups.UNBAN.length})
				</Button>
			</div>

			<Dialog
				open={dialogOpen}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) {
						closeDialog();
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{getDialogTitle()}</DialogTitle>
						<DialogDescription>{getDialogDescription()}</DialogDescription>
					</DialogHeader>

					{action === 'WARN' || action === 'BAN' ? (
						<div className="grid gap-2">
							<p className="text-sm font-medium">{t('reason')}</p>
							<Input
								value={reason}
								onChange={(event) => setReason(event.target.value)}
								placeholder={t('reasonPlaceholder')}
							/>
						</div>
					) : null}

					{error ? <p className="text-sm text-destructive">{error}</p> : null}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={closeDialog}
						>
							{t('cancel')}
						</Button>
						<Button
							variant={action === 'BAN' ? 'destructive' : 'default'}
							onClick={handleConfirm}
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
