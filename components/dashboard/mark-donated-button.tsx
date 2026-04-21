'use client';

import { useState, useEffect } from 'react';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Gift } from 'lucide-react';

type Participant = {
	id: string;
	name: string | null;
};

export function MarkDonatedButton({
	itemId,
	itemTitle,
}: {
	itemId: string;
	itemTitle: string;
}) {
	const router = useRouter();
	const t = useTranslations('Dashboard');
	const [open, setOpen] = useState(false);
	const [participants, setParticipants] = useState<Participant[]>([]);
	const [recipientId, setRecipientId] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		// Fetch conversation participants for this item
		fetch(`/api/items/${itemId}/recipients`)
			.then((r) => r.json())
			.then((data) => {
				if (Array.isArray(data)) setParticipants(data);
			})
			.catch(() => {});
	}, [open, itemId]);

	async function handleMarkDonated() {
		setLoading(true);
		const res = await fetch(`/api/items/${itemId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				status: 'DONATED',
				recipientId: recipientId || undefined,
			}),
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
						title={t('markDonated')}
					/>
				}
			>
				<Gift className="size-4" />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('markDonated')}</DialogTitle>
					<DialogDescription>
						{t('markDonatedDescription')} {itemTitle}.
					</DialogDescription>
				</DialogHeader>

				{participants.length > 0 && (
					<div className="grid gap-2">
						<label className="text-sm font-medium">
							{t('selectRecipient')}
						</label>
						<Select
							value={recipientId}
							onValueChange={(v) => v && setRecipientId(v)}
						>
							<SelectTrigger>
								<SelectValue placeholder={t('selectRecipient')} />
							</SelectTrigger>
							<SelectContent>
								{participants.map((p) => (
									<SelectItem
										key={p.id}
										value={p.id}
									>
										{p.name ?? p.id.slice(0, 8)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
					>
						{t('cancel')}
					</Button>
					<Button
						onClick={handleMarkDonated}
						disabled={loading}
					>
						{loading ? t('saving') : t('markAsDonated')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
