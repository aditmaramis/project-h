'use client';

import { useState } from 'react';
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

type ModerationStatus = 'REVIEWED' | 'DISMISSED';

export function ReportStatusActions({ reportId }: { reportId: string }) {
	const t = useTranslations('Admin');
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [status, setStatus] = useState<ModerationStatus>('REVIEWED');
	const [adminNote, setAdminNote] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function openDialog(nextStatus: ModerationStatus) {
		setStatus(nextStatus);
		setAdminNote('');
		setError(null);
		setOpen(true);
	}

	async function handleSubmit() {
		if (loading) {
			return;
		}

		if (status === 'DISMISSED' && !adminNote.trim()) {
			setError(t('dismissReasonRequired'));
			return;
		}

		setLoading(true);
		setError(null);

		const res = await fetch(`/api/admin/reports/${reportId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				status,
				adminNote: adminNote.trim() || undefined,
			}),
		});

		setLoading(false);

		if (!res.ok) {
			setError(t('moderationActionError'));
			return;
		}

		setOpen(false);
		router.refresh();
	}

	const dialogTitle =
		status === 'REVIEWED' ? t('reviewReport') : t('dismissReport');

	const dialogDescription =
		status === 'REVIEWED'
			? t('reviewReportDescription')
			: t('dismissReportDescription');

	return (
		<div className="flex items-center justify-end gap-2">
			<Button
				size="sm"
				variant="outline"
				onClick={() => openDialog('REVIEWED')}
			>
				{t('reviewReport')}
			</Button>
			<Button
				size="sm"
				variant="destructive"
				onClick={() => openDialog('DISMISSED')}
			>
				{t('dismissReport')}
			</Button>

			<Dialog
				open={open}
				onOpenChange={setOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{dialogTitle}</DialogTitle>
						<DialogDescription>{dialogDescription}</DialogDescription>
					</DialogHeader>

					<div className="grid gap-2">
						<p className="text-sm font-medium">{t('adminNote')}</p>
						<Input
							value={adminNote}
							onChange={(event) => setAdminNote(event.target.value)}
							placeholder={
								status === 'DISMISSED'
									? t('dismissReasonPlaceholder')
									: t('adminNoteOptionalPlaceholder')
							}
						/>
					</div>

					{error ? <p className="text-sm text-destructive">{error}</p> : null}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
						>
							{t('cancel')}
						</Button>
						<Button
							variant={status === 'DISMISSED' ? 'destructive' : 'default'}
							onClick={handleSubmit}
							disabled={loading}
						>
							{loading ? t('saving') : t('submitModerationAction')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
