import { z } from 'zod';

export const adminStatsQuerySchema = z.object({
	period: z.enum(['today', 'week', 'month']).optional().default('today'),
});

export const banUserSchema = z.object({
	userId: z.string().uuid(),
	reason: z.string().min(1, 'Reason is required').max(500),
});

export const warnUserSchema = z.object({
	userId: z.string().uuid(),
	reason: z.string().min(1, 'Reason is required').max(500),
});

export const resolveReportSchema = z.object({
	reportId: z.string().min(1),
	status: z.enum(['REVIEWED', 'DISMISSED']),
	adminNote: z.string().max(1000).optional(),
});

export const bannedKeywordSchema = z.object({
	keyword: z
		.string()
		.min(2, 'Keyword must be at least 2 characters')
		.max(100, 'Keyword must be at most 100 characters'),
});

export const adminUsersQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	search: z.string().trim().max(100).optional(),
	role: z.enum(['USER', 'ADMIN']).optional(),
	banStatus: z.enum(['ACTIVE', 'BANNED']).optional(),
	sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updateAdminUserSchema = z.discriminatedUnion('action', [
	z.object({
		userId: z.string().uuid(),
		action: z.literal('BAN'),
		reason: z.string().trim().min(1, 'Reason is required').max(500),
	}),
	z.object({
		userId: z.string().uuid(),
		action: z.literal('UNBAN'),
	}),
	z.object({
		userId: z.string().uuid(),
		action: z.literal('WARN'),
		reason: z.string().trim().min(1, 'Reason is required').max(500),
	}),
	z.object({
		userId: z.string().uuid(),
		action: z.literal('SET_ROLE'),
		role: z.enum(['USER', 'ADMIN']),
	}),
]);

const itemStatusSchema = z.enum(['AVAILABLE', 'RESERVED', 'DONATED']);
const itemConditionSchema = z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']);

export const adminItemsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	search: z.string().trim().max(100).optional(),
	status: itemStatusSchema.optional(),
	categoryId: z.string().min(1).optional(),
	sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updateAdminItemSchema = z
	.object({
		itemId: z.string().min(1),
		title: z.string().trim().min(3).max(100).optional(),
		description: z.string().trim().min(10).max(2000).optional(),
		condition: itemConditionSchema.optional(),
		status: itemStatusSchema.optional(),
		categoryId: z.string().min(1).optional(),
		reason: z.string().trim().max(500).optional(),
	})
	.refine(
		(value) =>
			value.title !== undefined ||
			value.description !== undefined ||
			value.condition !== undefined ||
			value.status !== undefined ||
			value.categoryId !== undefined,
		{
			message: 'At least one field is required',
			path: ['title'],
		},
	);

export const deleteAdminItemSchema = z.object({
	itemId: z.string().min(1),
	reason: z.string().trim().min(1, 'Reason is required').max(500),
});

export type AdminStatsQuery = z.infer<typeof adminStatsQuerySchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type WarnUserInput = z.infer<typeof warnUserSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type BannedKeywordInput = z.infer<typeof bannedKeywordSchema>;
export type AdminUsersQueryInput = z.infer<typeof adminUsersQuerySchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
export type AdminItemsQueryInput = z.infer<typeof adminItemsQuerySchema>;
export type UpdateAdminItemInput = z.infer<typeof updateAdminItemSchema>;
export type DeleteAdminItemInput = z.infer<typeof deleteAdminItemSchema>;
