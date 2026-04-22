import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { TopBar } from '@/components/layout/top-bar';
import { Header } from '@/components/layout/header';
import { FloatingChatWidgetServer } from '@/components/chat/floating-chat-widget-server';
import { TooltipProvider } from '@/components/ui/tooltip';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'Metadata' });

	return {
		title: t('title'),
		description: t('description'),
	};
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	setRequestLocale(locale);

	return (
		<html
			lang={locale}
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<head suppressHydrationWarning>
				<link
					rel="preconnect"
					href="https://fonts.bunny.net"
					crossOrigin="anonymous"
				/>
				<link
					href="https://fonts.bunny.net/css?family=dm-serif-display:400,400i&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body className="min-h-full flex flex-col">
				<NextIntlClientProvider>
					<TooltipProvider>
						<TopBar />
						<Header />
						{children}
						<FloatingChatWidgetServer />
					</TooltipProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
