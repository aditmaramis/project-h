import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { slugifyItemTitle } from '../lib/item-url';

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type PendingItem = {
	id: string;
	title: string;
	categoryId: string;
};

function pickNextSlug(baseSlug: string, existingSlugs: string[]): string {
	const existing = new Set(existingSlugs);
	if (!existing.has(baseSlug)) {
		return baseSlug;
	}

	let nextSuffix = 2;
	for (const slug of existing) {
		if (!slug.startsWith(`${baseSlug}-`)) {
			continue;
		}

		const suffixPart = slug.slice(baseSlug.length + 1);
		const suffix = Number.parseInt(suffixPart, 10);
		if (Number.isInteger(suffix) && suffix >= nextSuffix) {
			nextSuffix = suffix + 1;
		}
	}

	return `${baseSlug}-${nextSuffix}`;
}

async function main() {
	const pendingItems = await prisma.$queryRaw<PendingItem[]>`
		SELECT id::text AS id, title, "categoryId"::text AS "categoryId"
		FROM items
		WHERE "slug" IS NULL OR "slug" = ''
		ORDER BY "createdAt" ASC
	`;

	if (pendingItems.length === 0) {
		console.log('No item slugs to backfill.');
		return;
	}

	for (const pendingItem of pendingItems) {
		const baseSlug = slugifyItemTitle(pendingItem.title);
		const existingRows = await prisma.item.findMany({
			where: {
				categoryId: pendingItem.categoryId,
				slug: { startsWith: baseSlug },
				NOT: {
					id: pendingItem.id,
				},
			},
			select: {
				slug: true,
			},
		});

		const nextSlug = pickNextSlug(
			baseSlug,
			existingRows.map((row) => row.slug),
		);

		await prisma.item.update({
			where: {
				id: pendingItem.id,
			},
			data: {
				slug: nextSlug,
			},
		});
	}

	console.log(`Backfilled ${pendingItems.length} item slugs.`);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (error) => {
		console.error(error);
		await prisma.$disconnect();
		process.exit(1);
	});
