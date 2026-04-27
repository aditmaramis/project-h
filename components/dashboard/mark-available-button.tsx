'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
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
import { PackageCheck } from 'lucide-react';

export function MarkAvailableButton({
	itemId,
	itemTitle,
}: {
	itemId: string;
	itemTitle: string;
}) {
	const router = useRouter();
	const t = useTranslations('Dashboard');
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleMarkAvailable() {
		setLoading(true);
		const res = await fetch(`/api/items/${itemId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'AVAILABLE' }),
		});
		setLoading(false);

		if (res.ok) {
			setOpen(false);
			router.refresh();
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						className="cursor-pointer"
						title={t('markAvailable')}
					/>
				}
			>
				<PackageCheck className="size-4" />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('markAvailable')}</DialogTitle>
					<DialogDescription>
						{t('markAvailableDescription')} {itemTitle}.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
					>
						{t('cancel')}
					</Button>
					<Button
						onClick={handleMarkAvailable}
						disabled={loading}
					>
						{loading ? t('saving') : t('markAsAvailable')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
