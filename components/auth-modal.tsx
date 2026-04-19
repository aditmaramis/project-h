'use client';

import { type ReactElement, useState } from 'react';
import { useTranslations } from 'next-intl';
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
	trigger: ReactElement;
};

export function AuthModal({ mode, trigger }: AuthModalProps) {
	const [open, setOpen] = useState(false);
	const [activeMode, setActiveMode] = useState<'login' | 'signup'>(mode);
	const t = useTranslations('Auth');

	const isLogin = activeMode === 'login';

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			setActiveMode(mode);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={handleOpenChange}
		>
			<DialogTrigger render={trigger} />
			<DialogContent
				className={
					isLogin
						? 'max-h-[88svh] overflow-y-auto'
						: 'max-h-[88svh] overflow-y-auto sm:max-w-3xl'
				}
			>
				<DialogHeader>
					<DialogTitle>
						{isLogin ? t('loginTitle') : t('signupTitle')}
					</DialogTitle>
					<DialogDescription>
						{isLogin ? t('loginDescription') : t('signupDescription')}
					</DialogDescription>
				</DialogHeader>
				{isLogin ? (
					<LoginForm onSuccess={() => setOpen(false)} />
				) : (
					<SignupForm onSuccess={() => setOpen(false)} />
				)}
				<p className="text-center text-sm text-muted-foreground">
					{isLogin ? t('noAccount') + ' ' : t('hasAccount') + ' '}
					<button
						type="button"
						className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
						onClick={() => setActiveMode(isLogin ? 'signup' : 'login')}
					>
						{isLogin ? t('signup') : t('login')}
					</button>
				</p>
			</DialogContent>
		</Dialog>
	);
}
