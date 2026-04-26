export function slugifyItemTitle(title: string | null | undefined): string {
	if (!title) {
		return 'item';
	}

	const normalized = title
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 64);

	return normalized || 'item';
}

function normalizeCategorySlug(categorySlug: string): string {
	const normalized = categorySlug
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48);

	return normalized || 'items';
}

export function buildItemSlug(itemTitle: string): string {
	return slugifyItemTitle(itemTitle);
}

export function buildItemHref(input: {
	categorySlug: string;
	itemSlug: string;
}): string {
	const categorySlug = normalizeCategorySlug(input.categorySlug);
	const itemSlug = slugifyItemTitle(input.itemSlug);
	return `/items/${categorySlug}/${itemSlug}`;
}
