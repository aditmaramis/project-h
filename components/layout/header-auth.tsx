'use client';

import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth-modal';
import { LogoutButton } from '@/components/logout-button';
import { useSupabase } from '@/hooks/use-supabase';

type HeaderAuthProps = {
	initialIsLoggedIn: boolean;
};

export function HeaderAuth({ initialIsLoggedIn }: HeaderAuthProps) {
	const supabase = useSupabase();
	const router = useRouter();
	const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);

	useEffect(() => {
		setIsLoggedIn(initialIsLoggedIn);
	}, [initialIsLoggedIn]);

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			setIsLoggedIn(!!session?.user);

			if (
				event === 'SIGNED_IN' ||
				event === 'SIGNED_OUT' ||
				event === 'USER_UPDATED'
			) {
				startTransition(() => {
					router.refresh();
				});
			}
		});

		const syncAuthState = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setIsLoggedIn(!!user);
			startTransition(() => {
				router.refresh();
			});
		};

		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) {
				void syncAuthState();
			}
		};

		const handlePopState = () => {
			void syncAuthState();
		};

		window.addEventListener('pageshow', handlePageShow);
		window.addEventListener('popstate', handlePopState);

		return () => {
			subscription.unsubscribe();
			window.removeEventListener('pageshow', handlePageShow);
			window.removeEventListener('popstate', handlePopState);
		};
	}, [router, supabase]);

	if (isLoggedIn) {
		return <LogoutButton />;
	}

	return (
		<>
			<AuthModal
				mode="login"
				trigger={
					<Button
						variant="ghost"
						size="sm"
					>
						Log in
					</Button>
				}
			/>
			<AuthModal
				mode="signup"
				trigger={<Button size="sm">Sign up</Button>}
			/>
		</>
	);
}
