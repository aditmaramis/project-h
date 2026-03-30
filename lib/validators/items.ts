import { z } from 'zod';

export const createItemSchema = z.object({
	title: z
		.string()
		.min(3, 'Title must be at least 3 characters')
		.max(100, 'Title must be at most 100 characters'),
	description: z
		.string()
		.min(10, 'Description must be at least 10 characters')
		.max(2000, 'Description must be at most 2000 characters'),
	condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']),
	categoryId: z.string().min(1, 'Please select a category'),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	address: z.string().optional(),
	images: z
		.array(z.string().url())
		.min(1, 'Please upload at least one image')
		.max(5, 'Maximum 5 images allowed'),
});

export const updateItemSchema = createItemSchema.partial().extend({
	status: z.enum(['AVAILABLE', 'RESERVED', 'DONATED']).optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
