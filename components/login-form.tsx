'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabase } from '@/hooks/use-supabase';
import { loginSchema } from '@/lib/validators/auth';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
	const supabase = useSupabase();
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		const parsed = loginSchema.safeParse({ email, password });
		if (!parsed.success) {
			setError(
				parsed.error.flatten().fieldErrors.email?.[0] ??
					parsed.error.flatten().fieldErrors.password?.[0] ??
					'Invalid input',
			);
			return;
		}

		setLoading(true);
		const { error: authError } = await supabase.auth.signInWithPassword({
			email: parsed.data.email,
			password: parsed.data.password,
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
				<Label htmlFor="login-email">Email</Label>
				<Input
					id="login-email"
					type="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					autoComplete="email"
					required
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="login-password">Password</Label>
				<Input
					id="login-password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					autoComplete="current-password"
					required
				/>
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<Button
				type="submit"
				disabled={loading}
			>
				{loading ? 'Signing in…' : 'Log in'}
			</Button>
		</form>
	);
}
