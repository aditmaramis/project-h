'use client';

import { useState, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Camera, Building2, User } from 'lucide-react';
import { useSupabase } from '@/hooks/use-supabase';

type Props = {
	initialName: string;
	initialBio: string;
	initialAvatarUrl: string;
	accountType: 'PERSONAL' | 'ORGANIZATION';
	isVerified: boolean;
};

export function ProfileSettingsForm({
	initialName,
	initialBio,
	initialAvatarUrl,
	accountType,
	isVerified,
}: Props) {
	const supabase = useSupabase();
	const router = useRouter();
	const t = useTranslations('Dashboard');
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [name, setName] = useState(initialName);
	const [bio, setBio] = useState(initialBio);
	const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const initials = name
		? name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: '?';

	async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type and size (max 2MB)
		if (!file.type.startsWith('image/')) return;
		if (file.size > 2 * 1024 * 1024) return;

		setUploading(true);
		setError(null);

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			setUploading(false);
			return;
		}

		const fileExt = file.name.split('.').pop();
		const filePath = `${user.id}/avatar.${fileExt}`;

		const { error: uploadError } = await supabase.storage
			.from('avatars')
			.upload(filePath, file, { upsert: true });

		if (uploadError) {
			setError(uploadError.message);
			setUploading(false);
			return;
		}

		const {
			data: { publicUrl },
		} = supabase.storage.from('avatars').getPublicUrl(filePath);

		// Append cache-buster to force refresh
		setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
		setUploading(false);
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setMessage(null);

		const res = await fetch('/api/profile', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: name || undefined,
				bio: bio || undefined,
				avatarUrl: avatarUrl || undefined,
			}),
		});

		setSaving(false);

		if (!res.ok) {
			const data = await res.json();
			setError(data.error?.fieldErrors?.name?.[0] ?? 'Something went wrong');
			return;
		}

		setMessage(t('profileUpdated'));
		router.refresh();
	}

	return (
		<form
			onSubmit={handleSave}
			className="grid gap-6"
		>
			{/* Avatar section */}
			<Card>
				<CardHeader>
					<CardTitle>{t('avatar')}</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center gap-6">
					<div className="relative">
						<Avatar className="size-20">
							<AvatarImage
								src={avatarUrl || undefined}
								alt={name}
							/>
							<AvatarFallback className="text-lg">{initials}</AvatarFallback>
						</Avatar>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading}
							className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
						>
							<Camera className="size-3.5" />
						</button>
					</div>
					<div className="flex-1">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading}
						>
							{uploading
								? t('saving')
								: avatarUrl
									? t('changeAvatar')
									: t('uploadAvatar')}
						</Button>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleAvatarUpload}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Profile info */}
			<Card>
				<CardHeader>
					<CardTitle>{t('profileSettings')}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="settings-name">{t('name')}</Label>
						<Input
							id="settings-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t('name')}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="settings-bio">{t('bio')}</Label>
						<textarea
							id="settings-bio"
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							placeholder={t('bioPlaceholder')}
							rows={3}
							className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							maxLength={500}
						/>
					</div>

					<Separator />

					{/* Account type (read-only) */}
					<div className="grid gap-2">
						<Label>{t('accountType')}</Label>
						<div className="flex items-center gap-2">
							{accountType === 'ORGANIZATION' ? (
								<Building2 className="size-4 text-muted-foreground" />
							) : (
								<User className="size-4 text-muted-foreground" />
							)}
							<span className="text-sm">
								{t(
									accountType === 'ORGANIZATION' ? 'organization' : 'personal',
								)}
							</span>
							{accountType === 'ORGANIZATION' && (
								<Badge variant={isVerified ? 'default' : 'secondary'}>
									{isVerified ? t('verified') : t('unverified')}
								</Badge>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{error && <p className="text-sm text-destructive">{error}</p>}
			{message && <p className="text-sm text-green-600">{message}</p>}

			<div className="flex justify-end">
				<Button
					type="submit"
					disabled={saving}
				>
					{saving ? t('saving') : t('saveChanges')}
				</Button>
			</div>
		</form>
	);
}
