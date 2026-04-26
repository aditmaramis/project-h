import { prisma } from '@/lib/prisma';
import { slugifyItemTitle } from '@/lib/item-url';

export async function generateUniqueItemSlug(input: {
	title: string;
	categoryId: string;
	excludeItemId?: string;
}): Promise<string> {
	const baseSlug = slugifyItemTitle(input.title);
	const existingRows = await prisma.item.findMany({
		where: {
			categoryId: input.categoryId,
			slug: { startsWith: baseSlug },
			...(input.excludeItemId
				? {
						NOT: {
							id: input.excludeItemId,
						},
					}
				: {}),
		},
		select: {
			slug: true,
		},
	});

	const existingSlugs = new Set(existingRows.map((row) => row.slug));
	if (!existingSlugs.has(baseSlug)) {
		return baseSlug;
	}

	let nextSuffix = 2;
	for (const existingSlug of existingSlugs) {
		if (!existingSlug.startsWith(`${baseSlug}-`)) {
			continue;
		}

		const suffixPart = existingSlug.slice(baseSlug.length + 1);
		const suffix = Number.parseInt(suffixPart, 10);
		if (Number.isInteger(suffix) && suffix >= nextSuffix) {
			nextSuffix = suffix + 1;
		}
	}

	return `${baseSlug}-${nextSuffix}`;
}
