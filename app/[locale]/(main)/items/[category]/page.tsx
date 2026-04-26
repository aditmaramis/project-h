import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { redirect } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { buildItemHref } from '@/lib/item-url';

type Props = {
	params: Promise<{ locale: string; category: string }>;
};

export default async function LegacyItemDetailRedirectPage({ params }: Props) {
	const { locale, category: legacyId } = await params;
	setRequestLocale(locale);

	const item = await prisma.item.findUnique({
		where: { id: legacyId },
		select: {
			slug: true,
			category: {
				select: {
					slug: true,
				},
			},
		},
	});

	if (!item) {
		notFound();
	}

	redirect({
		href: buildItemHref({
			categorySlug: item.category.slug,
			itemSlug: item.slug,
		}),
		locale,
	});

	return null;
}
