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
import { Trash2 } from 'lucide-react';

export function DeleteItemButton({
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

	async function handleDelete() {
		setLoading(true);
		const res = await fetch(`/api/items/${itemId}`, {
			method: 'DELETE',
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
						title={t('deleteItem')}
					/>
				}
			>
				<Trash2 className="size-4" />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('deleteItem')}</DialogTitle>
					<DialogDescription>
						{t('confirmDelete')} {itemTitle}. {t('confirmDeleteDescription')}
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
						variant="destructive"
						onClick={handleDelete}
						disabled={loading}
					>
						{loading ? t('saving') : t('deleteItem')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
