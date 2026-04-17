'use client';

import { useState } from 'react';
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
import { useSupabase } from '@/hooks/use-supabase';
import { signupSchema } from '@/lib/validators/auth';

export function SignupForm({ onSuccess }: { onSuccess?: () => void }) {
	const supabase = useSupabase();
	const router = useRouter();
	const t = useTranslations('Auth');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [accountType, setAccountType] = useState<'PERSONAL' | 'ORGANIZATION'>(
		'PERSONAL',
	);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

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
		const { error: authError } = await supabase.auth.signUp({
			email: parsed.data.email,
			password: parsed.data.password,
			options: {
				data: {
					name: parsed.data.name,
					account_type: parsed.data.accountType,
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
