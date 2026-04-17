'use client';

import { useState, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, X } from 'lucide-react';
import { LocationPicker } from '@/components/map';
import { useSupabase } from '@/hooks/use-supabase';
import { createItemSchema, updateItemSchema } from '@/lib/validators/items';
import type { Category } from '@/types';

type Props = {
	categories: Category[];
	initialData?: {
		id: string;
		title: string;
		description: string;
		condition: string;
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
	const t = useTranslations('Dashboard');
	const fileInputRef = useRef<HTMLInputElement>(null);

	const isEditing = !!initialData;

	const [title, setTitle] = useState(initialData?.title ?? '');
	const [description, setDescription] = useState(
		initialData?.description ?? '',
	);
	const [condition, setCondition] = useState(initialData?.condition ?? '');
	const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
	const [latitude, setLatitude] = useState(initialData?.latitude ?? 0);
	const [longitude, setLongitude] = useState(initialData?.longitude ?? 0);
	const [address, setAddress] = useState(initialData?.address ?? '');
	const [images, setImages] = useState<string[]>(initialData?.images ?? []);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		if (images.length + files.length > 5) {
			setError('Maximum 5 images allowed');
			return;
		}

		setUploading(true);
		setError(null);

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			setUploading(false);
			return;
		}

		const newUrls: string[] = [];

		for (const file of Array.from(files)) {
			if (!file.type.startsWith('image/')) continue;
			if (file.size > 5 * 1024 * 1024) continue; // 5MB max per image

			const fileExt = file.name.split('.').pop();
			const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

			const { error: uploadError } = await supabase.storage
				.from('items')
				.upload(filePath, file);

			if (uploadError) {
				setError(uploadError.message);
				continue;
			}

			const {
				data: { publicUrl },
			} = supabase.storage.from('items').getPublicUrl(filePath);

			newUrls.push(publicUrl);
		}

		setImages((prev) => [...prev, ...newUrls]);
		setUploading(false);

		// Reset file input
		if (fileInputRef.current) fileInputRef.current.value = '';
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
			setError(firstError ?? 'Invalid input');
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
			setError(resData.error?.message ?? 'Something went wrong');
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
						<Label htmlFor="item-title">{t('name')}</Label>
						<Input
							id="item-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Item title"
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="item-description">Description</Label>
						<textarea
							id="item-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe your item…"
							rows={4}
							className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							required
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<Label>Condition</Label>
							<Select
								value={condition}
								onValueChange={(v) => v && setCondition(v)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select condition" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="NEW">New</SelectItem>
									<SelectItem value="LIKE_NEW">Like New</SelectItem>
									<SelectItem value="GOOD">Good</SelectItem>
									<SelectItem value="FAIR">Fair</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label>Category</Label>
							<Select
								value={categoryId}
								onValueChange={(v) => v && setCategoryId(v)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((cat) => (
										<SelectItem
											key={cat.id}
											value={cat.id}
										>
											{cat.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Images */}
			<Card>
				<CardHeader>
					<CardTitle>Images</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
						{images.map((url, i) => (
							<div
								key={url}
								className="group relative aspect-square"
							>
								<img
									src={url}
									alt={`Image ${i + 1}`}
									className="size-full rounded-md object-cover"
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
						{images.length}/5 images &middot; Max 5MB each
					</p>
				</CardContent>
			</Card>

			{/* Location */}
			<Card>
				<CardHeader>
					<CardTitle>Location</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<LocationPicker
						defaultPosition={
							latitude && longitude ? [latitude, longitude] : undefined
						}
						onLocationSelect={(lat, lng) => {
							setLatitude(lat);
							setLongitude(lng);
						}}
					/>
					<div className="grid gap-2">
						<Label htmlFor="item-address">Address (optional)</Label>
						<Input
							id="item-address"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							placeholder="Street address or area name"
						/>
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
