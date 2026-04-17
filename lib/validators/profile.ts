import { z } from 'zod';

export const updateProfileSchema = z.object({
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters')
		.max(100, 'Name must be at most 100 characters')
		.optional(),
	bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
	avatarUrl: z.string().url('Invalid URL').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
