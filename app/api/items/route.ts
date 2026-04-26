import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { generateUniqueItemSlug } from '@/lib/item-slug';
import { createItemSchema } from '@/lib/validators/items';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const categoryId = searchParams.get('categoryId');
	const status = searchParams.get('status') ?? 'AVAILABLE';
	const lat = searchParams.get('lat');
	const lng = searchParams.get('lng');
	const radius = searchParams.get('radius'); // in km

	const where: Record<string, unknown> = {
		status,
	};

	if (categoryId) {
		where.categoryId = categoryId;
	}

	const items = await prisma.item.findMany({
		where,
		include: {
			category: true,
			donor: { select: { id: true, name: true, avatarUrl: true } },
		},
		orderBy: { createdAt: 'desc' },
		take: 50,
	});

	// If lat/lng/radius provided, filter by distance client-side
	// (for a production app, use PostGIS or a raw SQL query with Haversine)
	if (lat && lng && radius) {
		const userLat = parseFloat(lat);
		const userLng = parseFloat(lng);
		const maxDistance = parseFloat(radius);

		const filtered = items.filter((item) => {
			const distance = haversineDistance(
				userLat,
				userLng,
				item.latitude,
				item.longitude,
			);
			return distance <= maxDistance;
		});

		return NextResponse.json(filtered);
	}

	return NextResponse.json(items);
}

export async function POST(request: Request) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const parsed = createItemSchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const slug = await generateUniqueItemSlug({
		title: parsed.data.title,
		categoryId: parsed.data.categoryId,
	});

	const item = await prisma.item.create({
		data: {
			...parsed.data,
			slug,
			donorId: user.id,
		},
		include: {
			category: true,
		},
	});

	return NextResponse.json(item, { status: 201 });
}

/** Haversine distance in km between two lat/lng points */
function haversineDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) *
			Math.cos(toRad(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function toRad(deg: number): number {
	return deg * (Math.PI / 180);
}
