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
import { Clock } from 'lucide-react';

export function MarkReservedButton({
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

	async function handleMarkReserved() {
		setLoading(true);
		const res = await fetch(`/api/items/${itemId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'RESERVED' }),
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
						title={t('markReserved')}
					/>
				}
			>
				<Clock className="size-4" />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('markReserved')}</DialogTitle>
					<DialogDescription>
						{t('markReservedDescription')} {itemTitle}.
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
						onClick={handleMarkReserved}
						disabled={loading}
					>
						{loading ? t('saving') : t('markAsReserved')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
