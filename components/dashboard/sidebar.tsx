'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import {
	LayoutDashboard,
	Package,
	Heart,
	MessageSquare,
	Settings,
	Gift,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

const navItems = [
	{ key: 'overview', href: '/dashboard', icon: LayoutDashboard },
	{ key: 'myItems', href: '/dashboard/items', icon: Package },
	{ key: 'favorites', href: '/dashboard/favorites', icon: Heart },
	{ key: 'messages', href: '/chat', icon: MessageSquare },
	{ key: 'settings', href: '/dashboard/settings', icon: Settings },
] as const;

type Props = {
	userName: string | null;
	avatarUrl: string | null;
};

export function DashboardSidebar({ userName, avatarUrl }: Props) {
	const t = useTranslations('Dashboard');
	const pathname = usePathname();

	const initials = userName
		? userName
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: '?';

	return (
		<Sidebar
			collapsible="icon"
			variant="inset"
		>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							render={<Link href="/dashboard" />}
						>
							<Avatar className="size-8">
								<AvatarImage
									src={avatarUrl ?? undefined}
									alt={userName ?? ''}
								/>
								<AvatarFallback className="text-xs">{initials}</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">
									{userName ?? t('title')}
								</span>
								<span className="truncate text-xs text-muted-foreground">
									{t('title')}
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>{t('title')}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const isActive =
									item.href === '/dashboard'
										? pathname === '/dashboard'
										: pathname.startsWith(item.href);
								return (
									<SidebarMenuItem key={item.key}>
										<SidebarMenuButton
											render={<Link href={item.href} />}
											isActive={isActive}
											tooltip={t(item.key)}
										>
											<item.icon />
											<span>{t(item.key)}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
