import type {
	Profile,
	Item,
	Category,
	Conversation,
	Message,
	ConversationParticipant,
	ItemCondition,
	ItemStatus,
} from '@/lib/generated/prisma/client';

// Re-export Prisma types for convenience
export type {
	Profile,
	Item,
	Category,
	Conversation,
	Message,
	ConversationParticipant,
	ItemCondition,
	ItemStatus,
};

// Composite types for API responses
export type ItemWithRelations = Item & {
	category: Category;
	donor: Pick<Profile, 'id' | 'name' | 'avatarUrl'>;
};

export type ConversationWithRelations = Conversation & {
	item: Pick<Item, 'id' | 'title' | 'images'>;
	participants: (ConversationParticipant & {
		profile: Pick<Profile, 'id' | 'name' | 'avatarUrl'>;
	})[];
	messages: Message[];
};

export type MessageWithSender = Message & {
	sender: Pick<Profile, 'id' | 'name' | 'avatarUrl'>;
};
