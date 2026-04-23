'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { LocationPicker } from '@/components/map';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useSupabase } from '@/hooks/use-supabase';
import { createItemSchema, updateItemSchema } from '@/lib/validators/items';
import type { Category } from '@/types';

type PickupMethod = 'SELF_PICKUP' | 'DELIVERY';

type Props = {
	categories: Category[];
	initialData?: {
		id: string;
		title: string;
		description: string;
		condition: string;
		pickupMethods: PickupMethod[];
		categoryId: string;
		latitude: number;
		longitude: number;
		address: string | null;
		images: string[];
		status?: string;
	};
};

export function ItemForm({ categories, initialData }: Props) {
	const supabase = useSupabase();
	const router = useRouter();
	const locale = useLocale();
	const t = useTranslations('Dashboard');
	const categoryT = useTranslations('Categories');
	const { latitude: detectedLatitude, longitude: detectedLongitude } =
		useGeolocation();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const isEditing = !!initialData;

	const [title, setTitle] = useState(initialData?.title ?? '');
	const [description, setDescription] = useState(
		initialData?.description ?? '',
	);
	const [condition, setCondition] = useState(initialData?.condition ?? '');
	const [pickupMethods, setPickupMethods] = useState<PickupMethod[]>(
		initialData?.pickupMethods ?? ['SELF_PICKUP'],
	);
	const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
	const [latitude, setLatitude] = useState(initialData?.latitude ?? 0);
	const [longitude, setLongitude] = useState(initialData?.longitude ?? 0);
	const [address, setAddress] = useState(initialData?.address ?? '');
	const [images, setImages] = useState<string[]>(initialData?.images ?? []);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [resolvingLocationLabel, setResolvingLocationLabel] = useState(false);
	const [didAutofillLocation, setDidAutofillLocation] = useState(isEditing);
	const [uploadNotice, setUploadNotice] = useState<{
		variant: 'default' | 'secondary' | 'destructive';
		message: string;
	} | null>(null);
	const maxImageSizeBytes = 500 * 1024;
	const itemBucket = 'Items';
	const formSelectTriggerClassName =
		'w-full transition-none focus-visible:ring-0';
	const formSelectContentClassName =
		'data-open:animate-none data-closed:animate-none';

	const categoryTranslationKeys = new Set([
		'electronics',
		'clothing',
		'furniture',
		'books',
		'kitchen',
		'sports',
		'toys',
		'other',
	]);

	function formatDisplayLabel(raw: string) {
		return raw
			.split(/[\s_-]+/)
			.filter(Boolean)
			.map(
				(segment) =>
					segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
			)
			.join(' ');
	}

	function getConditionLabel(value: string) {
		switch (value) {
			case 'NEW':
				return t('conditionNew');
			case 'LIKE_NEW':
				return t('conditionLikeNew');
			case 'GOOD':
				return t('conditionGood');
			case 'FAIR':
				return t('conditionFair');
			default:
				return formatDisplayLabel(value);
		}
	}

	function getCategoryLabel(category: Category) {
		const slugKey = category.slug.toLowerCase();
		if (categoryTranslationKeys.has(slugKey)) {
			return categoryT(slugKey);
		}

		return formatDisplayLabel(category.name);
	}

	function togglePickupMethod(method: PickupMethod, checked: boolean) {
		setPickupMethods((prev) => {
			if (checked) {
				if (prev.includes(method)) return prev;
				return [...prev, method];
			}

			return prev.filter((value) => value !== method);
		});
	}

	const selectedCategory = categories.find((cat) => cat.id === categoryId);

	useEffect(() => {
		if (didAutofillLocation || isEditing) return;
		if (detectedLatitude == null || detectedLongitude == null) return;

		queueMicrotask(() => {
			setLatitude(detectedLatitude);
			setLongitude(detectedLongitude);
			setDidAutofillLocation(true);
		});
	}, [detectedLatitude, detectedLongitude, didAutofillLocation, isEditing]);

	useEffect(() => {
		if (latitude === 0 && longitude === 0) return;

		const controller = new AbortController();
		queueMicrotask(() => {
			setResolvingLocationLabel(true);
		});

		fetch(
			`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
			{
				headers: {
					'Accept-Language': locale,
				},
				signal: controller.signal,
			},
		)
			.then((res) => res.json())
			.then((data) => {
				const resolvedAddress = data?.address;
				const district =
					resolvedAddress?.city_district ||
					resolvedAddress?.suburb ||
					resolvedAddress?.municipality ||
					resolvedAddress?.city ||
					resolvedAddress?.town ||
					resolvedAddress?.village ||
					resolvedAddress?.county ||
					'';
				const region =
					resolvedAddress?.state ||
					resolvedAddress?.region ||
					resolvedAddress?.state_district ||
					resolvedAddress?.province ||
					'';
				const country = resolvedAddress?.country || '';
				const districtRegionCountry = [district, region, country]
					.filter(Boolean)
					.join(', ');

				if (districtRegionCountry) {
					setAddress(districtRegionCountry);
				}
			})
			.catch(() => undefined)
			.finally(() => {
				setResolvingLocationLabel(false);
			});

		return () => controller.abort();
	}, [latitude, locale, longitude]);

	function getUploadErrorMessage(
		rawMessage: string | null | undefined,
	): string {
		if (!rawMessage) return t('imageUploadFailed');
		const normalizedMessage = rawMessage.toLowerCase();
		if (normalizedMessage.includes('bucket not found')) {
			return t('missingStorageBucket', { bucket: itemBucket });
		}
		if (normalizedMessage.includes('row-level security policy')) {
			return t('storagePolicyDenied', { bucket: itemBucket });
		}
		return rawMessage;
	}

	async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		if (images.length + files.length > 5) {
			const message = t('imageLimitError');
			setError(message);
			setUploadNotice({ variant: 'destructive', message });
			if (fileInputRef.current) fileInputRef.current.value = '';
			return;
		}

		setUploading(true);
		setError(null);
		setUploadNotice({
			variant: 'secondary',
			message: t('uploadingImages', { count: files.length }),
		});

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				const message = t('uploadAuthRequired');
				setError(message);
				setUploadNotice({ variant: 'destructive', message });
				return;
			}

			const newUrls: string[] = [];
			let uploadedCount = 0;
			let failedCount = 0;
			let firstFailureMessage: string | null = null;

			for (const file of Array.from(files)) {
				if (!file.type.startsWith('image/')) {
					failedCount += 1;
					firstFailureMessage ??= t('invalidImageType');
					continue;
				}
				if (file.size > maxImageSizeBytes) {
					failedCount += 1;
					firstFailureMessage ??= t('invalidImageSize');
					continue;
				}

				const fileExt = file.name.split('.').pop();
				const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

				const { error: uploadError } = await supabase.storage
					.from(itemBucket)
					.upload(filePath, file);

				if (uploadError) {
					failedCount += 1;
					firstFailureMessage ??= getUploadErrorMessage(uploadError.message);
					continue;
				}

				const {
					data: { publicUrl },
				} = supabase.storage.from(itemBucket).getPublicUrl(filePath);

				newUrls.push(publicUrl);
				uploadedCount += 1;
			}

			if (newUrls.length > 0) {
				setImages((prev) => [...prev, ...newUrls]);
			}

			if (failedCount === 0) {
				setError(null);
				setUploadNotice({
					variant: 'default',
					message: t('imageUploadSuccess', { count: uploadedCount }),
				});
				return;
			}

			if (uploadedCount > 0) {
				setError(firstFailureMessage ?? t('imageUploadFailed'));
				setUploadNotice({
					variant: 'destructive',
					message: t('imageUploadPartial', {
						uploaded: uploadedCount,
						failed: failedCount,
					}),
				});
				return;
			}

			const message = firstFailureMessage ?? t('imageUploadFailedAll');
			setError(message);
			setUploadNotice({ variant: 'destructive', message });
		} catch {
			const message = t('imageUploadFailed');
			setError(message);
			setUploadNotice({ variant: 'destructive', message });
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	}

	function removeImage(index: number) {
		setImages((prev) => prev.filter((_, i) => i !== index));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		const data = {
			title,
			description,
			condition,
			pickupMethods,
			categoryId,
			latitude,
			longitude,
			address: address || undefined,
			images,
		};

		const schema = isEditing ? updateItemSchema : createItemSchema;
		const parsed = schema.safeParse(data);

		if (!parsed.success) {
			const fieldErrors = parsed.error.flatten().fieldErrors;
			const firstError = Object.values(fieldErrors).flat()[0];
			setError(firstError ?? t('invalidInput'));
			return;
		}

		setSaving(true);

		const url = isEditing ? `/api/items/${initialData.id}` : '/api/items';
		const method = isEditing ? 'PATCH' : 'POST';

		const res = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(parsed.data),
		});

		setSaving(false);

		if (!res.ok) {
			const resData = await res.json();
			setError(resData.error?.message ?? t('somethingWentWrong'));
			return;
		}

		router.push('/dashboard/items');
		router.refresh();
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="grid gap-6"
		>
			{/* Basic info */}
			<Card>
				<CardHeader>
					<CardTitle>{isEditing ? t('editItem') : t('postItem')}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="item-title">{t('itemTitle')}</Label>
						<Input
							id="item-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t('itemTitlePlaceholder')}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="item-description">{t('description')}</Label>
						<textarea
							id="item-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t('itemDescriptionPlaceholder')}
							rows={4}
							className="flex min-h-25 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							required
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<Label>{t('condition')}</Label>
							<Select
								value={condition}
								onValueChange={(v) => v && setCondition(v)}
							>
								<SelectTrigger className={formSelectTriggerClassName}>
									<SelectValue placeholder={t('selectCondition')}>
										{condition ? getConditionLabel(condition) : undefined}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className={formSelectContentClassName}>
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
							<Label>{t('category')}</Label>
							<Select
								value={categoryId}
								onValueChange={(v) => v && setCategoryId(v)}
							>
								<SelectTrigger className={formSelectTriggerClassName}>
									<SelectValue placeholder={t('selectCategory')}>
										{selectedCategory
											? getCategoryLabel(selectedCategory)
											: undefined}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className={formSelectContentClassName}>
									{categories.map((cat) => (
										<SelectItem
											key={cat.id}
											value={cat.id}
										>
											{getCategoryLabel(cat)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid gap-2">
						<Label>{t('pickupMethods')}</Label>
						<div className="grid gap-3 rounded-md border p-3">
							<div className="flex items-center gap-2">
								<Checkbox
									id="pickup-self"
									checked={pickupMethods.includes('SELF_PICKUP')}
									onCheckedChange={(checked) =>
										togglePickupMethod('SELF_PICKUP', checked === true)
									}
								/>
								<Label
									htmlFor="pickup-self"
									className="font-normal"
								>
									{t('pickupMethodSelfPickup')}
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox
									id="pickup-delivery"
									checked={pickupMethods.includes('DELIVERY')}
									onCheckedChange={(checked) =>
										togglePickupMethod('DELIVERY', checked === true)
									}
								/>
								<Label
									htmlFor="pickup-delivery"
									className="font-normal"
								>
									{t('pickupMethodDelivery')}
								</Label>
							</div>
						</div>
						<p className="text-xs text-muted-foreground">
							{t('pickupMethodsHint')}
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Images */}
			<Card>
				<CardHeader>
					<CardTitle>{t('images')}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
						{images.map((url, i) => (
							<div
								key={url}
								className="group relative aspect-square"
							>
								<Image
									src={url}
									alt={`Image ${i + 1}`}
									fill
									className="rounded-md object-cover"
								/>
								<button
									type="button"
									onClick={() => removeImage(i)}
									className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
								>
									<X className="size-3" />
								</button>
							</div>
						))}
						{images.length < 5 && (
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={uploading}
								className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors disabled:opacity-50"
							>
								<ImagePlus className="size-6 text-muted-foreground" />
							</button>
						)}
					</div>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						multiple
						className="hidden"
						onChange={handleImageUpload}
					/>
					<p className="mt-2 text-xs text-muted-foreground">
						{t('imagesHint', { count: images.length })}
					</p>
					{uploadNotice && (
						<div className="mt-2">
							<Badge variant={uploadNotice.variant}>
								{uploading && <Loader2 className="size-3 animate-spin" />}
								{uploadNotice.message}
							</Badge>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Location */}
			<Card>
				<CardHeader>
					<CardTitle>{t('location')}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<LocationPicker
						defaultPosition={
							latitude && longitude ? [latitude, longitude] : undefined
						}
						onLocationSelect={(lat, lng) => {
							setLatitude(lat);
							setLongitude(lng);
							setDidAutofillLocation(true);
						}}
					/>
					<p className="text-xs text-muted-foreground">
						{t('locationApproximate')}
					</p>
					<div className="grid gap-2">
						<Label htmlFor="item-address">
							{t('locationDistrictRegionCountryLabel')}
						</Label>
						<Input
							id="item-address"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							placeholder={t('locationDistrictRegionCountryPlaceholder')}
							autoComplete="address-level1"
						/>
						{resolvingLocationLabel && (
							<p className="text-xs text-muted-foreground">
								{t('locationDistrictRegionCountryResolving')}
							</p>
						)}
					</div>
					{latitude !== 0 && longitude !== 0 && (
						<div className="flex gap-2">
							<Badge variant="outline">
								{latitude.toFixed(4)}, {longitude.toFixed(4)}
							</Badge>
						</div>
					)}
				</CardContent>
			</Card>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
				>
					{t('cancel')}
				</Button>
				<Button
					type="submit"
					disabled={saving || uploading}
				>
					{saving ? t('saving') : isEditing ? t('saveChanges') : t('postItem')}
				</Button>
			</div>
		</form>
	);
}
