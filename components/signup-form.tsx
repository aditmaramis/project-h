'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationPicker } from '@/components/map';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useSupabase } from '@/hooks/use-supabase';
import { signupSchema } from '@/lib/validators/auth';

const LOCATION_PRIVACY_RADIUS_KM = 2;

function toCoarseLocation(latitude: number, longitude: number) {
	const latStep = LOCATION_PRIVACY_RADIUS_KM / 110.574;
	const lngDivisor = Math.max(
		111.32 * Math.cos((latitude * Math.PI) / 180),
		0.0001,
	);
	const lngStep = LOCATION_PRIVACY_RADIUS_KM / lngDivisor;

	return {
		latitude: Number((Math.round(latitude / latStep) * latStep).toFixed(4)),
		longitude: Number((Math.round(longitude / lngStep) * lngStep).toFixed(4)),
	};
}

export function SignupForm({ onSuccess }: { onSuccess?: () => void }) {
	const supabase = useSupabase();
	const router = useRouter();
	const locale = useLocale();
	const t = useTranslations('Auth');
	const { latitude: detectedLatitude, longitude: detectedLongitude } =
		useGeolocation();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [accountType, setAccountType] = useState<'PERSONAL' | 'ORGANIZATION'>(
		'PERSONAL',
	);
	const [selectedLocation, setSelectedLocation] = useState<
		[number, number] | null
	>(null);
	const [locationDistrict, setLocationDistrict] = useState('');
	const [locationRegion, setLocationRegion] = useState('');
	const [locationCountry, setLocationCountry] = useState('');
	const [districtRegionCountry, setDistrictRegionCountry] = useState('');
	const [resolvingLocationLabel, setResolvingLocationLabel] = useState(false);
	const [didAutofillLocation, setDidAutofillLocation] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (didAutofillLocation) return;
		if (detectedLatitude == null || detectedLongitude == null) return;

		const coarse = toCoarseLocation(detectedLatitude, detectedLongitude);
		queueMicrotask(() => {
			setSelectedLocation([coarse.latitude, coarse.longitude]);
			setDidAutofillLocation(true);
		});
	}, [detectedLatitude, detectedLongitude, didAutofillLocation]);

	const coarseLocation = useMemo(() => {
		if (!selectedLocation) return null;

		return toCoarseLocation(selectedLocation[0], selectedLocation[1]);
	}, [selectedLocation]);

	useEffect(() => {
		if (!selectedLocation) return;

		const [latitude, longitude] = selectedLocation;
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
				const address = data?.address;
				const nextDistrict =
					address?.city_district ||
					address?.suburb ||
					address?.municipality ||
					address?.city ||
					address?.town ||
					address?.village ||
					address?.county ||
					'';
				const nextRegion =
					address?.state ||
					address?.region ||
					address?.state_district ||
					address?.province ||
					'';
				const nextCountry = address?.country || '';
				const nextDistrictRegionCountry = [
					nextDistrict,
					nextRegion,
					nextCountry,
				]
					.filter(Boolean)
					.join(', ');

				setLocationDistrict(nextDistrict);
				setLocationRegion(nextRegion);
				setLocationCountry(nextCountry);
				setDistrictRegionCountry(nextDistrictRegionCountry);
			})
			.catch(() => {
				setLocationDistrict('');
				setLocationRegion('');
				setLocationCountry('');
				setDistrictRegionCountry('');
			})
			.finally(() => {
				setResolvingLocationLabel(false);
			});

		return () => controller.abort();
	}, [locale, selectedLocation]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		const parsed = signupSchema.safeParse({
			name,
			email,
			password,
			accountType,
		});
		if (!parsed.success) {
			const fieldErrors = parsed.error.flatten().fieldErrors;
			setError(
				fieldErrors.name?.[0] ??
					fieldErrors.email?.[0] ??
					fieldErrors.password?.[0] ??
					t('invalidInput'),
			);
			return;
		}

		setLoading(true);
		const [manualDistrict, manualRegion, ...manualCountryParts] =
			districtRegionCountry
				.split(',')
				.map((part) => part.trim())
				.filter(Boolean);
		const parsedDistrict = manualDistrict ?? '';
		const parsedRegion = manualRegion ?? '';
		const parsedCountry = manualCountryParts.join(', ');

		const { error: authError } = await supabase.auth.signUp({
			email: parsed.data.email,
			password: parsed.data.password,
			options: {
				data: {
					name: parsed.data.name,
					account_type: parsed.data.accountType,
					location_district: parsedDistrict || locationDistrict || undefined,
					location_region: parsedRegion || locationRegion || undefined,
					location_country: parsedCountry || locationCountry || undefined,
					location_latitude: coarseLocation?.latitude,
					location_longitude: coarseLocation?.longitude,
					location_radius_km: coarseLocation
						? LOCATION_PRIVACY_RADIUS_KM
						: undefined,
				},
			},
		});
		setLoading(false);

		if (authError) {
			setError(authError.message);
			return;
		}

		onSuccess?.();
		router.refresh();
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="grid gap-4"
		>
			<div className="grid gap-2">
				<Label htmlFor="signup-account-type">{t('accountType')}</Label>
				<Select
					value={accountType}
					onValueChange={(v) =>
						setAccountType(v as 'PERSONAL' | 'ORGANIZATION')
					}
				>
					<SelectTrigger id="signup-account-type">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="PERSONAL">{t('personal')}</SelectItem>
						<SelectItem value="ORGANIZATION">{t('organization')}</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="signup-name">{t('name')}</Label>
				<Input
					id="signup-name"
					type="text"
					placeholder={t('namePlaceholder')}
					value={name}
					onChange={(e) => setName(e.target.value)}
					autoComplete="name"
					required
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="signup-email">{t('email')}</Label>
				<Input
					id="signup-email"
					type="email"
					placeholder={t('emailPlaceholder')}
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					autoComplete="email"
					required
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="signup-password">{t('password')}</Label>
				<Input
					id="signup-password"
					type="password"
					placeholder={t('passwordPlaceholder')}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					autoComplete="new-password"
					required
				/>
			</div>
			<div className="grid gap-2">
				<Label>{t('locationLabel')}</Label>
				<LocationPicker
					defaultPosition={selectedLocation ?? undefined}
					heightClass="h-56"
					onLocationSelect={(latitude, longitude) => {
						setSelectedLocation([latitude, longitude]);
						setDidAutofillLocation(true);
					}}
				/>
				<p className="text-xs text-muted-foreground">
					{t('locationApproximate')}
				</p>
				<div className="grid gap-2">
					<Input
						id="signup-district-region-country"
						value={districtRegionCountry}
						onChange={(event) => setDistrictRegionCountry(event.target.value)}
						placeholder={t('locationDistrictRegionCountryPlaceholder')}
						autoComplete="address-level1"
					/>
					{resolvingLocationLabel && (
						<p className="text-xs text-muted-foreground">
							{t('locationDistrictRegionCountryResolving')}
						</p>
					)}
				</div>
				{coarseLocation && (
					<Badge variant="outline">
						{coarseLocation.latitude.toFixed(3)},{' '}
						{coarseLocation.longitude.toFixed(3)}
					</Badge>
				)}
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<Button
				type="submit"
				disabled={loading}
			>
				{loading ? t('creatingAccount') : t('signup')}
			</Button>
		</form>
	);
}
