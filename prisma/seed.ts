import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const categories = [
	{ name: 'Electronics', slug: 'electronics', icon: 'Laptop' },
	{ name: 'Clothing', slug: 'clothing', icon: 'Shirt' },
	{ name: 'Furniture', slug: 'furniture', icon: 'Armchair' },
	{ name: 'Books', slug: 'books', icon: 'BookOpen' },
	{ name: 'Kitchen', slug: 'kitchen', icon: 'UtensilsCrossed' },
	{ name: 'Sports', slug: 'sports', icon: 'Dumbbell' },
	{ name: 'Toys', slug: 'toys', icon: 'ToyBrick' },
	{ name: 'Other', slug: 'other', icon: 'Package' },
];

async function main() {
	console.log('Seeding categories...');

	for (const category of categories) {
		await prisma.category.upsert({
			where: { slug: category.slug },
			update: {},
			create: category,
		});
	}

	console.log(`Seeded ${categories.length} categories.`);

	// Promote a user to ADMIN if ADMIN_EMAIL is set
	const adminEmail = process.env.ADMIN_EMAIL;
	if (adminEmail) {
		const result = await prisma.profile.updateMany({
			where: { email: adminEmail },
			data: { role: 'ADMIN' },
		});
		if (result.count > 0) {
			console.log(`Promoted ${adminEmail} to ADMIN.`);
		} else {
			console.log(
				`No profile found for ${adminEmail}. Sign up first, then re-run seed.`,
			);
		}
	}
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
