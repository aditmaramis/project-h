'use client';

import { ReactNode, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { LoginForm } from '@/components/login-form';
import { SignupForm } from '@/components/signup-form';

type AuthModalProps = {
	mode: 'login' | 'signup';
	trigger: ReactNode;
};

export function AuthModal({ mode, trigger }: AuthModalProps) {
	const [open, setOpen] = useState(false);
	const [activeMode, setActiveMode] = useState<'login' | 'signup'>(mode);

	const isLogin = activeMode === 'login';

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			// Reset to initial mode when closed
			setActiveMode(mode);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={handleOpenChange}
		>
			<DialogTrigger render={<span />}>{trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isLogin ? 'Log in to Hibah' : 'Create your Hibah account'}
					</DialogTitle>
					<DialogDescription>
						{isLogin
							? 'Welcome back! Sign in to continue.'
							: 'Join Hibah and start giving freely.'}
					</DialogDescription>
				</DialogHeader>
				{isLogin ? (
					<LoginForm onSuccess={() => setOpen(false)} />
				) : (
					<SignupForm onSuccess={() => setOpen(false)} />
				)}
				<p className="text-center text-sm text-muted-foreground">
					{isLogin ? "Don't have an account? " : 'Already have an account? '}
					<button
						type="button"
						className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
						onClick={() => setActiveMode(isLogin ? 'signup' : 'login')}
					>
						{isLogin ? 'Sign up' : 'Log in'}
					</button>
				</p>
			</DialogContent>
		</Dialog>
	);
}
