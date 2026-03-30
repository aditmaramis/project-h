import { z } from 'zod';

export const sendMessageSchema = z.object({
	conversationId: z.string().min(1),
	content: z.string().min(1, 'Message cannot be empty').max(2000),
});

export const createConversationSchema = z.object({
	itemId: z.string().min(1),
	participantId: z.string().uuid(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
