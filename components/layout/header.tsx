import Link from 'next/link';
import { Gift } from 'lucide-react';
import { HeaderAuth } from '@/components/layout/header-auth';
import { createClient } from '@/lib/supabase/server';

export async function Header() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<Link
					href="/"
					className="flex items-center gap-2 font-bold text-xl"
				>
					<Gift className="h-6 w-6" />
					Hibah
				</Link>
				<nav className="flex items-center gap-2">
					<HeaderAuth initialIsLoggedIn={!!user} />
				</nav>
			</div>
		</header>
	);
}
