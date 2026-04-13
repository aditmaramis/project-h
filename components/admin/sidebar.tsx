'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import {
	LayoutDashboard,
	Users,
	FileText,
	Flag,
	ShieldAlert,
	Gift,
} from 'lucide-react';
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
	{ key: 'overview', href: '/admin', icon: LayoutDashboard },
	{ key: 'users', href: '/admin/users', icon: Users },
	{ key: 'content', href: '/admin/content', icon: FileText },
	{ key: 'reports', href: '/admin/reports', icon: Flag },
	{ key: 'keywords', href: '/admin/keywords', icon: ShieldAlert },
] as const;

export function AdminSidebar() {
	const t = useTranslations('Admin');
	const pathname = usePathname();

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
							render={<Link href="/admin" />}
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								<Gift className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">{t('title')}</span>
								<span className="truncate text-xs text-muted-foreground">
									Hibah
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
									item.href === '/admin'
										? pathname === '/admin'
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
