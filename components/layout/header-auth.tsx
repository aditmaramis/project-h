'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
	Heart,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	Package,
	Settings,
	User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AuthModal } from '@/components/auth-modal';
import { useSupabase } from '@/hooks/use-supabase';
import { buildProfileHref } from '@/lib/profile-url';

type HeaderAuthProps = {
	initialIsLoggedIn: boolean;
	initialUserId: string | null;
	initialUserName: string | null;
	initialAvatarUrl: string | null;
};

export function HeaderAuth({
	initialIsLoggedIn,
	initialUserId,
	initialUserName,
	initialAvatarUrl,
}: HeaderAuthProps) {
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
		return (
			<HeaderUserMenu
				userId={initialUserId}
				userName={initialUserName}
				avatarUrl={initialAvatarUrl}
			/>
		);
	}

	return <HeaderAuthButtons />;
}

type HeaderUserMenuProps = {
	userId: string | null;
	userName: string | null;
	avatarUrl: string | null;
};

function HeaderUserMenu({ userId, userName, avatarUrl }: HeaderUserMenuProps) {
	const supabase = useSupabase();
	const router = useRouter();
	const tDashboard = useTranslations('Dashboard');
	const tAuth = useTranslations('Auth');
	const [open, setOpen] = useState(false);
	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const initials = userName
		? userName
				.split(' ')
				.map((part) => part[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: '?';

	async function handleLogout() {
		await supabase.auth.signOut();
		startTransition(() => {
			router.replace('/');
			router.refresh();
		});
	}

	function handleNavigate(path: string) {
		router.push(path);
	}

	function handleMouseEnter() {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
		setOpen(true);
	}

	function handleMouseLeave() {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
		}
		closeTimeoutRef.current = setTimeout(() => {
			setOpen(false);
		}, 120);
	}

	useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

	return (
		<DropdownMenu
			open={open}
			onOpenChange={setOpen}
		>
			<DropdownMenuTrigger
				className="flex items-center gap-2 rounded-md px-1 py-1 outline-hidden transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				<Avatar className="size-8">
					<AvatarImage
						src={avatarUrl ?? undefined}
						alt={userName ?? tAuth('profile')}
					/>
					<AvatarFallback className="text-xs">{initials}</AvatarFallback>
				</Avatar>
				<span className="max-w-32 truncate text-sm font-medium">
					{userName ?? tAuth('profile')}
				</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-56"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				<DropdownMenuItem onClick={() => handleNavigate('/dashboard')}>
					<LayoutDashboard className="size-4" />
					{tDashboard('title')}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() =>
						handleNavigate(
							userId
								? buildProfileHref(userId, userName)
								: '/dashboard/settings',
						)
					}
				>
					<User className="size-4" />
					{tAuth('profile')}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleNavigate('/dashboard/items')}>
					<Package className="size-4" />
					{tDashboard('myItems')}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => handleNavigate('/dashboard/favorites')}
				>
					<Heart className="size-4" />
					{tDashboard('favorites')}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleNavigate('/chat')}>
					<MessageSquare className="size-4" />
					{tDashboard('messages')}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleNavigate('/dashboard/settings')}>
					<Settings className="size-4" />
					{tDashboard('settings')}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={handleLogout}
				>
					<LogOut className="size-4" />
					{tAuth('logout')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function HeaderAuthButtons() {
	const t = useTranslations('Auth');

	return (
		<>
			<AuthModal
				mode="login"
				trigger={
					<Button
						variant="ghost"
						size="sm"
					>
						{t('login')}
					</Button>
				}
			/>
			<AuthModal
				mode="signup"
				trigger={<Button size="sm">{t('signup')}</Button>}
			/>
		</>
	);
}
