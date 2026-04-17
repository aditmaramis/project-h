import type {
	Profile,
	Item,
	Category,
	Conversation,
	Message,
	ConversationParticipant,
	Favorite,
	ItemCondition,
	ItemStatus,
	UserRole,
	AccountType,
	Report,
	ReportStatus,
	ReportTargetType,
	AdminAction,
	AdminActionType,
	BannedKeyword,
} from '@/lib/generated/prisma/client';

// Re-export Prisma types for convenience
export type {
	Profile,
	Item,
	Category,
	Conversation,
	Message,
	ConversationParticipant,
	Favorite,
	ItemCondition,
	ItemStatus,
	UserRole,
	AccountType,
	Report,
	ReportStatus,
	ReportTargetType,
	AdminAction,
	AdminActionType,
	BannedKeyword,
};

// Composite types for API responses
export type ItemWithRelations = Item & {
	category: Category;
	donor: Pick<Profile, 'id' | 'name' | 'avatarUrl'>;
};

export type ItemWithFavorite = ItemWithRelations & {
	favorites?: Pick<Favorite, 'id'>[];
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

// Admin composite types
export type ReportWithRelations = Report & {
	reporter: Pick<Profile, 'id' | 'name' | 'email' | 'avatarUrl'>;
	resolvedBy?: Pick<Profile, 'id' | 'name'> | null;
};

export type AdminActionWithAdmin = AdminAction & {
	admin: Pick<Profile, 'id' | 'name' | 'avatarUrl'>;
};

// Dashboard composite types
export type DashboardStats = {
	totalItems: number;
	activeItems: number;
	donatedItems: number;
	activeConversations: number;
	totalFavorites: number;
};

export type AdminStats = {
	totalUsers: number;
	newUsersToday: number;
	newUsersThisWeek: number;
	newUsersThisMonth: number;
	totalItems: number;
	newItemsToday: number;
	newItemsThisWeek: number;
	newItemsThisMonth: number;
	itemsByStatus: { status: string; count: number }[];
	totalConversations: number;
	pendingReports: number;
	recentActionsCount: number;
};
