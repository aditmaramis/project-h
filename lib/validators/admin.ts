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

export type AdminStatsQuery = z.infer<typeof adminStatsQuerySchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type WarnUserInput = z.infer<typeof warnUserSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type BannedKeywordInput = z.infer<typeof bannedKeywordSchema>;
export type AdminUsersQueryInput = z.infer<typeof adminUsersQuerySchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
