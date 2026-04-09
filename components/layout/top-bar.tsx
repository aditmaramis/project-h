import Link from 'next/link';
import { Info } from 'lucide-react';
import { HeaderLocation } from '@/components/layout/header-location';

export function TopBar() {
	return (
		<div className="w-full border-b border-border/50 bg-muted/50 text-sm">
			<div className="container mx-auto flex h-9 items-center justify-between px-4">
				<HeaderLocation />
				<Link
					href="/about"
					className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
				>
					<Info className="h-3.5 w-3.5" />
					About
				</Link>
			</div>
		</div>
	);
}
