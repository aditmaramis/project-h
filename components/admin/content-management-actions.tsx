'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';

type ItemStatus = 'AVAILABLE' | 'RESERVED' | 'DONATED';
type ItemCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';

type ContentItemSummary = {
	id: string;
	title: string;
	status: ItemStatus;
	condition: ItemCondition;
	categoryId: string;
	categoryName: string;
	donor: {
		id: string;
		name: string | null;
		email: string;
		avatarUrl: string | null;
	};
	images: string[];
	createdAt: Date;
};

type CategoryOption = {
	id: string;
	name: string;
};

type ItemDetailsResponse = {
	item: {
		id: string;
		title: string;
		slug: string;
		description: string;
		condition: ItemCondition;
		status: ItemStatus;
		categoryId: string;
		donorId: string;
		images: string[];
		createdAt: string;
		updatedAt: string;
		category: {
			id: string;
			name: string;
			slug: string;
		};
		donor: {
			id: string;
			name: string | null;
			email: string;
			avatarUrl: string | null;
		};
	};
	stats: {
		conversations: number;
		favorites: number;
		reports: number;
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

type DialogMode = 'edit' | 'delete' | null;
type FieldErrors = {
	title?: string;
	description?: string;
	reason?: string;
	deleteReason?: string;
};

type FlattenedErrorPayload = {
	fieldErrors?: Record<string, string[] | undefined>;
	formErrors?: string[];
};

type ApiErrorPayload = {
	error?: string | FlattenedErrorPayload;
};

function firstFieldError(
	flattened: FlattenedErrorPayload | undefined,
	field: string,
) {
	return flattened?.fieldErrors?.[field]?.[0];
}

function firstFormError(flattened: FlattenedErrorPayload | undefined) {
	return flattened?.formErrors?.[0];
}

function formatActionLabel(
	t: ReturnType<typeof useTranslations>,
	action: string,
) {
	const mapping: Record<string, string> = {
		EDIT_ITEM: t('actionEditItem'),
		DELETE_ITEM: t('actionDeleteItem'),
	};

	return mapping[action] ?? action;
}

function statusLabel(
	t: ReturnType<typeof useTranslations>,
	status: ItemStatus,
) {
	if (status === 'RESERVED') {
		return t('reserved');
	}

	if (status === 'DONATED') {
		return t('donated');
	}

	return t('available');
}

function conditionLabel(
	t: ReturnType<typeof useTranslations>,
	condition: ItemCondition,
) {
	if (condition === 'LIKE_NEW') {
		return t('conditionLikeNew');
	}

	if (condition === 'GOOD') {
		return t('conditionGood');
	}

	if (condition === 'FAIR') {
		return t('conditionFair');
	}

	return t('conditionNew');
}

export function ContentManagementActions({
	item,
	categories,
}: {
	item: ContentItemSummary;
	categories: CategoryOption[];
}) {
	const t = useTranslations('Admin');
	const locale = useLocale();
	const router = useRouter();

	const [sheetOpen, setSheetOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<DialogMode>(null);
	const [detailsLoading, setDetailsLoading] = useState(false);
	const [detailsError, setDetailsError] = useState<string | null>(null);
	const [details, setDetails] = useState<ItemDetailsResponse | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	const [title, setTitle] = useState(item.title);
	const [description, setDescription] = useState('');
	const [condition, setCondition] = useState<ItemCondition>(item.condition);
	const [status, setStatus] = useState<ItemStatus>(item.status);
	const [categoryId, setCategoryId] = useState(item.categoryId);
	const [reason, setReason] = useState('');
	const [deleteReason, setDeleteReason] = useState('');

	function clearActionErrors() {
		setActionError(null);
		setFieldErrors({});
	}

	function resolveServerErrorMessage(
		payload: ApiErrorPayload | null,
		fallback: string,
	) {
		if (!payload?.error) {
			return fallback;
		}

		if (typeof payload.error === 'string') {
			if (payload.error === 'Category does not exist') {
				return t('itemCategoryMissing');
			}

			if (payload.error === 'At least one field is required') {
				return t('contentNoChanges');
			}

			return payload.error;
		}

		return firstFormError(payload.error) ?? fallback;
	}

	async function loadDetails() {
		setDetailsLoading(true);
		setDetailsError(null);

		const res = await fetch(`/api/admin/items/${item.id}`);
		if (!res.ok) {
			setDetailsLoading(false);
			setDetailsError(t('itemDetailsLoadError'));
			return;
		}

		const payload = (await res.json()) as ItemDetailsResponse;
		setDetails(payload);
		setTitle(payload.item.title);
		setDescription(payload.item.description);
		setCondition(payload.item.condition);
		setStatus(payload.item.status);
		setCategoryId(payload.item.categoryId);
		setDetailsLoading(false);
	}

	function openSheet() {
		setSheetOpen(true);
		clearActionErrors();
		void loadDetails().catch(() => {
			setDetailsError(t('itemDetailsLoadError'));
			setDetailsLoading(false);
		});
	}

	function openEditDialog() {
		if (details) {
			setTitle(details.item.title);
			setDescription(details.item.description);
			setCondition(details.item.condition);
			setStatus(details.item.status);
			setCategoryId(details.item.categoryId);
		}

		setReason('');
		setSheetOpen(false);
		clearActionErrors();
		setDialogMode('edit');
	}

	function openDeleteDialog() {
		setDeleteReason('');
		setSheetOpen(false);
		clearActionErrors();
		setDialogMode('delete');
	}

	function closeDialog() {
		if (submitting) {
			return;
		}

		setDialogMode(null);
		clearActionErrors();
	}

	async function handleStatusChange(nextStatus: ItemStatus) {
		if (!details || submitting || nextStatus === details.item.status) {
			return;
		}

		setSubmitting(true);
		clearActionErrors();

		const res = await fetch(`/api/admin/items/${item.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: nextStatus }),
		});

		setSubmitting(false);

		if (!res.ok) {
			setActionError(t('itemActionError'));
			return;
		}

		router.refresh();
		await loadDetails();
	}

	async function handleSubmitEdit() {
		if (!details || submitting) {
			return;
		}

		const nextTitle = title.trim();
		const nextDescription = description.trim();
		const nextReason = reason.trim();
		const titleChanged = nextTitle !== details.item.title;
		const descriptionChanged = nextDescription !== details.item.description;
		const conditionChanged = condition !== details.item.condition;
		const statusChanged = status !== details.item.status;
		const categoryChanged = categoryId !== details.item.categoryId;

		const nextFieldErrors: FieldErrors = {};

		if (titleChanged && nextTitle.length < 3) {
			nextFieldErrors.title = t('itemTitleTooShort');
		}

		if (titleChanged && nextTitle.length > 100) {
			nextFieldErrors.title = t('itemTitleTooLong');
		}

		if (descriptionChanged && nextDescription.length < 10) {
			nextFieldErrors.description = t('itemDescriptionTooShort');
		}

		if (descriptionChanged && nextDescription.length > 2000) {
			nextFieldErrors.description = t('itemDescriptionTooLong');
		}

		if (nextReason.length > 500) {
			nextFieldErrors.reason = t('reasonTooLong');
		}

		if (Object.keys(nextFieldErrors).length > 0) {
			setFieldErrors(nextFieldErrors);
			setActionError(t('itemValidationError'));
			return;
		}

		const payload: {
			title?: string;
			description?: string;
			condition?: ItemCondition;
			status?: ItemStatus;
			categoryId?: string;
			reason?: string;
		} = {};

		if (titleChanged) {
			payload.title = nextTitle;
		}

		if (descriptionChanged) {
			payload.description = nextDescription;
		}

		if (conditionChanged) {
			payload.condition = condition;
		}

		if (statusChanged) {
			payload.status = status;
		}

		if (categoryChanged) {
			payload.categoryId = categoryId;
		}

		if (nextReason) {
			payload.reason = nextReason;
		}

		if (
			!titleChanged &&
			!descriptionChanged &&
			!conditionChanged &&
			!statusChanged &&
			!categoryChanged
		) {
			setActionError(t('contentNoChanges'));
			return;
		}

		setSubmitting(true);
		clearActionErrors();

		const res = await fetch(`/api/admin/items/${item.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		setSubmitting(false);

		if (!res.ok) {
			const responsePayload =
				((await res.json().catch(() => null)) as ApiErrorPayload | null) ??
				null;

			if (responsePayload?.error && typeof responsePayload.error !== 'string') {
				setFieldErrors({
					title: firstFieldError(responsePayload.error, 'title'),
					description: firstFieldError(responsePayload.error, 'description'),
					reason: firstFieldError(responsePayload.error, 'reason'),
				});
			}

			setActionError(
				resolveServerErrorMessage(responsePayload, t('itemActionError')),
			);
			return;
		}

		setDialogMode(null);
		router.refresh();
		await loadDetails();
	}

	async function handleDeleteItem() {
		if (submitting) {
			return;
		}

		const trimmedDeleteReason = deleteReason.trim();

		if (!trimmedDeleteReason) {
			setFieldErrors({ deleteReason: t('deleteReasonRequired') });
			setActionError(t('deleteReasonRequired'));
			return;
		}

		if (trimmedDeleteReason.length > 500) {
			setFieldErrors({ deleteReason: t('deleteReasonTooLong') });
			setActionError(t('itemValidationError'));
			return;
		}

		setSubmitting(true);
		clearActionErrors();

		const res = await fetch(`/api/admin/items/${item.id}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ reason: trimmedDeleteReason }),
		});

		setSubmitting(false);

		if (!res.ok) {
			const responsePayload =
				((await res.json().catch(() => null)) as ApiErrorPayload | null) ??
				null;

			if (responsePayload?.error && typeof responsePayload.error !== 'string') {
				setFieldErrors({
					deleteReason: firstFieldError(responsePayload.error, 'reason'),
				});
			}

			setActionError(
				resolveServerErrorMessage(responsePayload, t('itemActionError')),
			);
			return;
		}

		setDialogMode(null);
		setSheetOpen(false);
		router.refresh();
	}

	const renderableImages =
		details?.item.images
			.map((image) => image.trim())
			.filter((image) => image.length > 0) ??
		item.images
			.map((image) => image.trim())
			.filter((image) => image.length > 0);

	return (
		<>
			<Button
				data-testid="admin-item-manage-button"
				type="button"
				size="sm"
				variant="outline"
				onClick={openSheet}
			>
				{t('manageItem')}
			</Button>

			<Sheet
				open={sheetOpen}
				onOpenChange={(nextOpen) => {
					setSheetOpen(nextOpen);
					if (!nextOpen) {
						setDialogMode(null);
						clearActionErrors();
					}
				}}
			>
				<SheetContent
					data-testid="admin-item-details-sheet"
					side="right"
					className="w-full overflow-y-auto sm:max-w-lg"
				>
					<SheetHeader>
						<SheetTitle>{t('itemDetails')}</SheetTitle>
						<SheetDescription>{t('itemDetailsDescription')}</SheetDescription>
					</SheetHeader>

					<div className="space-y-4 px-4 pb-4">
						{detailsLoading ? (
							<p className="text-sm text-muted-foreground">
								{t('loadingItemDetails')}
							</p>
						) : null}

						{detailsError ? (
							<p className="text-sm text-destructive">{detailsError}</p>
						) : null}

						{details ? (
							<>
								<div className="space-y-2">
									<p className="text-sm font-medium">{details.item.title}</p>
									<p className="whitespace-pre-wrap text-sm text-muted-foreground">
										{details.item.description}
									</p>
								</div>

								<div className="flex flex-wrap gap-2">
									<Badge variant="secondary">
										{statusLabel(t, details.item.status)}
									</Badge>
									<Badge variant="outline">
										{conditionLabel(t, details.item.condition)}
									</Badge>
									<Badge variant="outline">{details.item.category.name}</Badge>
								</div>

								<div className="space-y-2">
									<p className="text-sm font-medium">{t('donor')}</p>
									<div className="flex items-center gap-2">
										<Avatar className="size-8">
											<AvatarImage
												src={details.item.donor.avatarUrl ?? undefined}
												alt={
													details.item.donor.name ?? details.item.donor.email
												}
											/>
											<AvatarFallback>
												{(details.item.donor.name ?? details.item.donor.email)
													.charAt(0)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0">
											<p className="truncate text-sm">
												{details.item.donor.name ?? t('anonymousUser')}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{details.item.donor.email}
											</p>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
									<p>
										{t('statConversations')}: {details.stats.conversations}
									</p>
									<p>
										{t('statFavorites')}: {details.stats.favorites}
									</p>
									<p>
										{t('statReports')}: {details.stats.reports}
									</p>
								</div>

								<div className="grid grid-cols-3 gap-2">
									{(['AVAILABLE', 'RESERVED', 'DONATED'] as const).map(
										(nextStatus) => (
											<Button
												data-testid={`admin-item-status-${nextStatus}`}
												key={nextStatus}
												type="button"
												size="sm"
												variant={
													details.item.status === nextStatus
														? 'default'
														: 'outline'
												}
												onClick={() => handleStatusChange(nextStatus)}
												disabled={submitting}
											>
												{statusLabel(t, nextStatus)}
											</Button>
										),
									)}
								</div>

								{renderableImages.length > 0 ? (
									<div className="grid grid-cols-3 gap-2">
										{renderableImages.map((image, index) => (
											<div
												key={`${image}-${index}`}
												className="relative aspect-square overflow-hidden rounded-md border"
											>
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={image}
													alt={details.item.title}
													className="h-full w-full object-cover"
												/>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										{t('noItemImages')}
									</p>
								)}

								<div className="space-y-2 text-sm">
									<p className="font-medium">{t('recentModerationEvents')}</p>
									{details.recentActions.length === 0 ? (
										<p className="text-muted-foreground">
											{t('noModerationEvents')}
										</p>
									) : (
										<div className="space-y-1 text-muted-foreground">
											{details.recentActions.map((entry) => (
												<p key={entry.id}>
													{formatActionLabel(t, entry.actionType)} -{' '}
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

								<div className="grid gap-2">
									<Button
										data-testid="admin-item-edit-button"
										type="button"
										variant="outline"
										onClick={openEditDialog}
										disabled={submitting}
									>
										{t('editItemFields')}
									</Button>
									<Button
										data-testid="admin-item-delete-button"
										type="button"
										variant="destructive"
										onClick={openDeleteDialog}
										disabled={submitting}
									>
										{t('deleteItemCta')}
									</Button>
								</div>
							</>
						) : null}

						{actionError ? (
							<p
								data-testid="admin-item-action-error"
								className="text-sm text-destructive"
							>
								{actionError}
							</p>
						) : null}
					</div>
				</SheetContent>
			</Sheet>

			<Dialog
				open={dialogMode === 'edit'}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) {
						closeDialog();
					}
				}}
			>
				<DialogContent data-testid="admin-item-edit-dialog">
					<DialogHeader>
						<DialogTitle>{t('editItemFields')}</DialogTitle>
						<DialogDescription>{t('editItemDescription')}</DialogDescription>
					</DialogHeader>

					<div className="grid gap-3">
						<div className="grid gap-2">
							<Label htmlFor={`admin-item-title-${item.id}`}>{t('name')}</Label>
							<Input
								data-testid="admin-item-edit-title"
								id={`admin-item-title-${item.id}`}
								value={title}
								onChange={(event) => {
									setTitle(event.target.value);
									setFieldErrors((prev) => ({ ...prev, title: undefined }));
								}}
							/>
							{fieldErrors.title ? (
								<p
									data-testid="admin-item-edit-title-error"
									className="text-xs text-destructive"
								>
									{fieldErrors.title}
								</p>
							) : null}
						</div>

						<div className="grid gap-2">
							<Label htmlFor={`admin-item-description-${item.id}`}>
								{t('itemDescription')}
							</Label>
							<Textarea
								data-testid="admin-item-edit-description"
								id={`admin-item-description-${item.id}`}
								value={description}
								onChange={(event) => {
									setDescription(event.target.value);
									setFieldErrors((prev) => ({
										...prev,
										description: undefined,
									}));
								}}
								rows={5}
								className="resize-y"
							/>
							<div className="flex items-center justify-between">
								{fieldErrors.description ? (
									<p
										data-testid="admin-item-edit-description-error"
										className="text-xs text-destructive"
									>
										{fieldErrors.description}
									</p>
								) : (
									<span />
								)}
								<p className="text-xs text-muted-foreground">
									{t('descriptionCharacterCount', {
										count: description.length,
										max: 2000,
									})}
								</p>
							</div>
						</div>

						<div className="grid gap-2">
							<Label>{t('condition')}</Label>
							<Select
								value={condition}
								onValueChange={(value) => setCondition(value as ItemCondition)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="NEW">{t('conditionNew')}</SelectItem>
									<SelectItem value="LIKE_NEW">
										{t('conditionLikeNew')}
									</SelectItem>
									<SelectItem value="GOOD">{t('conditionGood')}</SelectItem>
									<SelectItem value="FAIR">{t('conditionFair')}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label>{t('status')}</Label>
							<Select
								value={status}
								onValueChange={(value) => setStatus(value as ItemStatus)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="AVAILABLE">{t('available')}</SelectItem>
									<SelectItem value="RESERVED">{t('reserved')}</SelectItem>
									<SelectItem value="DONATED">{t('donated')}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label>{t('category')}</Label>
							<Select
								value={categoryId}
								onValueChange={(value) => setCategoryId(value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{categories.map((category) => (
										<SelectItem
											key={category.id}
											value={category.id}
										>
											{category.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor={`admin-item-reason-${item.id}`}>
								{t('reason')}
							</Label>
							<Input
								data-testid="admin-item-edit-reason"
								id={`admin-item-reason-${item.id}`}
								value={reason}
								onChange={(event) => {
									setReason(event.target.value);
									setFieldErrors((prev) => ({ ...prev, reason: undefined }));
								}}
								placeholder={t('reasonOptional')}
							/>
							{fieldErrors.reason ? (
								<p
									data-testid="admin-item-edit-reason-error"
									className="text-xs text-destructive"
								>
									{fieldErrors.reason}
								</p>
							) : null}
						</div>
					</div>

					{actionError ? (
						<p
							data-testid="admin-item-edit-error"
							className="text-sm text-destructive"
						>
							{actionError}
						</p>
					) : null}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={closeDialog}
						>
							{t('cancel')}
						</Button>
						<Button
							data-testid="admin-item-save-button"
							type="button"
							onClick={handleSubmitEdit}
							disabled={submitting}
						>
							{submitting ? t('saving') : t('saveItemChanges')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={dialogMode === 'delete'}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) {
						closeDialog();
					}
				}}
			>
				<DialogContent data-testid="admin-item-delete-dialog">
					<DialogHeader>
						<DialogTitle>{t('deleteItemCta')}</DialogTitle>
						<DialogDescription>
							{t('deleteItemDescription', {
								title: details?.item.title ?? item.title,
							})}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-2">
						<Label htmlFor={`admin-item-delete-reason-${item.id}`}>
							{t('reason')}
						</Label>
						<Input
							data-testid="admin-item-delete-reason"
							id={`admin-item-delete-reason-${item.id}`}
							value={deleteReason}
							onChange={(event) => {
								setDeleteReason(event.target.value);
								setFieldErrors((prev) => ({
									...prev,
									deleteReason: undefined,
								}));
							}}
							placeholder={t('deleteReasonPlaceholder')}
						/>
						{fieldErrors.deleteReason ? (
							<p
								data-testid="admin-item-delete-reason-error"
								className="text-xs text-destructive"
							>
								{fieldErrors.deleteReason}
							</p>
						) : null}
					</div>

					{actionError ? (
						<p
							data-testid="admin-item-delete-error"
							className="text-sm text-destructive"
						>
							{actionError}
						</p>
					) : null}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={closeDialog}
						>
							{t('cancel')}
						</Button>
						<Button
							data-testid="admin-item-delete-confirm"
							type="button"
							variant="destructive"
							onClick={handleDeleteItem}
							disabled={submitting}
						>
							{submitting ? t('saving') : t('confirmDeleteItem')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
