import Link from 'next/link';
import { Gift } from 'lucide-react';

export function Header() {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<Link
					href="/"
					className="flex items-center gap-2 font-bold text-xl"
				>
					<Gift className="h-6 w-6" />
					Hibah
				</Link>
				<nav className="flex items-center gap-4">
					{/* TODO: Navigation links + auth state */}
				</nav>
			</div>
		</header>
	);
}
