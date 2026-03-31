'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabase } from '@/hooks/use-supabase';
import { signupSchema } from '@/lib/validators/auth';

export function SignupForm({ onSuccess }: { onSuccess?: () => void }) {
	const supabase = useSupabase();
	const router = useRouter();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		const parsed = signupSchema.safeParse({ name, email, password });
		if (!parsed.success) {
			const fieldErrors = parsed.error.flatten().fieldErrors;
			setError(
				fieldErrors.name?.[0] ??
					fieldErrors.email?.[0] ??
					fieldErrors.password?.[0] ??
					'Invalid input',
			);
			return;
		}

		setLoading(true);
		const { error: authError } = await supabase.auth.signUp({
			email: parsed.data.email,
			password: parsed.data.password,
			options: {
				data: { name: parsed.data.name },
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
				<Label htmlFor="signup-name">Name</Label>
				<Input
					id="signup-name"
					type="text"
					placeholder="Your name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					autoComplete="name"
					required
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="signup-email">Email</Label>
				<Input
					id="signup-email"
					type="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					autoComplete="email"
					required
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="signup-password">Password</Label>
				<Input
					id="signup-password"
					type="password"
					placeholder="At least 6 characters"
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
				{loading ? 'Creating account…' : 'Sign up'}
			</Button>
		</form>
	);
}
