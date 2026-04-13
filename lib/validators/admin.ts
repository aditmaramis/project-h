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

export type AdminStatsQuery = z.infer<typeof adminStatsQuerySchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type WarnUserInput = z.infer<typeof warnUserSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type BannedKeywordInput = z.infer<typeof bannedKeywordSchema>;
