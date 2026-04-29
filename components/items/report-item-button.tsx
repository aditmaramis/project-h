'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

type ReportReason =
	| 'SPAM'
	| 'SCAM'
	| 'WRONG_CATEGORY'
	| 'INAPPROPRIATE'
	| 'OTHER';

export function ReportItemButton({ itemId }: { itemId: string }) {
	const t = useTranslations('Items');
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState<ReportReason | ''>('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);

	async function handleSubmit() {
		if (!reason || loading) {
			return;
		}

		setError(null);
		setLoading(true);

		const res = await fetch('/api/reports', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				targetType: 'ITEM',
				targetId: itemId,
				reason,
			}),
		});

		setLoading(false);

		if (res.ok) {
			setSubmitted(true);
			setOpen(false);
			return;
		}

		if (res.status === 401) {
			setError(t('reportAuthRequired'));
			return;
		}

		if (res.status === 403) {
			setError(t('reportOwnItemForbidden'));
			return;
		}

		if (res.status === 409) {
			setSubmitted(true);
			setOpen(false);
			setError(t('reportAlreadySubmitted'));
			return;
		}

		setError(t('reportError'));
	}

	return (
		<div className="grid justify-items-end gap-2">
			<Dialog
				open={open}
				onOpenChange={setOpen}
			>
				<DialogTrigger
					render={
						<Button
							variant="ghost"
							size="sm"
							disabled={submitted}
							className="text-muted-foreground hover:text-destructive"
							title={t('reportThisProduct')}
						/>
					}
				>
					<Flag className="size-4" />
					{submitted ? t('reportSubmitted') : t('reportThisProduct')}
				</DialogTrigger>

				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('reportThisProduct')}</DialogTitle>
						<DialogDescription>
							{t('reportProductDescription')}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-2">
						<p className="text-sm font-medium">{t('reportReason')}</p>
						<Select
							value={reason}
							onValueChange={(value) => setReason(value as ReportReason)}
						>
							<SelectTrigger>
								<SelectValue placeholder={t('reportReasonPlaceholder')} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="SPAM">{t('reportReasonSpam')}</SelectItem>
								<SelectItem value="SCAM">{t('reportReasonScam')}</SelectItem>
								<SelectItem value="WRONG_CATEGORY">
									{t('reportReasonWrongCategory')}
								</SelectItem>
								<SelectItem value="INAPPROPRIATE">
									{t('reportReasonInappropriate')}
								</SelectItem>
								<SelectItem value="OTHER">{t('reportReasonOther')}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
						>
							{t('reportCancel')}
						</Button>
						<Button
							variant="destructive"
							onClick={handleSubmit}
							disabled={loading || !reason}
						>
							{loading ? t('reporting') : t('submitReport')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{error ? (
				<p className="text-right text-xs text-destructive">{error}</p>
			) : null}
		</div>
	);
}
