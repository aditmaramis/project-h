import { setRequestLocale } from 'next-intl/server';

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function ChatLayout({ children, params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <main className="flex-1">{children}</main>;
}
