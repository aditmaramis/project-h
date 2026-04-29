import { z } from 'zod';

const reportReasonEnum = z.enum([
	'SPAM',
	'SCAM',
	'WRONG_CATEGORY',
	'INAPPROPRIATE',
	'OTHER',
]);

export const createReportSchema = z.object({
	targetType: z.enum(['ITEM']),
	targetId: z.string().min(1),
	reason: reportReasonEnum,
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
