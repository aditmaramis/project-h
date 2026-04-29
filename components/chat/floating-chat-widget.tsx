'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, MessageCircleMore } from 'lucide-react';
import ChatInterface, {
	type ChatConfig,
	type Message as ChatMessage,
	type UiConfig as ChatUiConfig,
} from '@/components/chat/chat-interface';
import {
	OPEN_FLOATING_CHAT_WIDGET_EVENT,
	type OpenFloatingChatWidgetDetail,
} from '@/components/chat/floating-chat-events';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/hooks/use-supabase';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';

type Props = {
	userId: string;
};

type Conversation = {
	id: string;
	item: {
		title: string;
	};
	unreadCount: number;
	participants: Array<{
		profile: {
			id: string;
			name: string | null;
			avatarUrl: string | null;
		};
	}>;
	messages: Array<{
		content: string;
	}>;
};

type ConversationDetail = {
	id: string;
	item: {
		id: string;
		title: string;
	};
	participants: Array<{
		profile: {
			id: string;
			name: string | null;
			avatarUrl: string | null;
		};
	}>;
	messages: Array<{
		id: string;
		content: string;
		senderId: string;
		createdAt: string;
		sender: {
			id: string;
			name: string | null;
			avatarUrl: string | null;
		};
	}>;
};

type SentMessage = {
	id: string;
	content: string;
	senderId: string;
	createdAt: string;
	sender: {
		id: string;
		name: string | null;
		avatarUrl: string | null;
	};
};

type RealtimeMessageRow = {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	createdAt: string;
	readAt: string | null;
};

function getInitials(name: string | null) {
	if (!name) return '?';

	return name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

function isLikelyImageUrl(value: string) {
	const trimmed = value.trim();
	if (!/^https?:\/\//i.test(trimmed)) return false;
	if (trimmed.includes('images.unsplash.com')) return true;

	return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(trimmed);
}

const FALLBACK_LEFT_AVATAR =
	'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';
const FALLBACK_RIGHT_AVATAR =
	'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

export function FloatingChatWidget({ userId }: Props) {
	const supabase = useSupabase();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations('Chat');

	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeConversationId, setActiveConversationId] = useState<
		string | null
	>(null);
	const [threadLoading, setThreadLoading] = useState(false);
	const [threadError, setThreadError] = useState<string | null>(null);
	const [activeConversation, setActiveConversation] =
		useState<ConversationDetail | null>(null);
	const [composerValue, setComposerValue] = useState('');
	const [sending, setSending] = useState(false);
	const [sendingError, setSendingError] = useState<string | null>(null);
	const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

	const isChatRoute = pathname === '/chat' || pathname.startsWith('/chat/');
	const widgetRealtimeFallbackText = t.has('widgetRealtimeFallback')
		? t('widgetRealtimeFallback')
		: t('widgetLoadError');
	const widgetMessageInputLabel = t.has('widgetMessageInputLabel')
		? t('widgetMessageInputLabel')
		: t('messagePlaceholder');

	const loadConversations = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const res = await fetch('/api/chat', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
				cache: 'no-store',
			});

			if (!res.ok) {
				setError(t('widgetLoadError'));
				return;
			}

			const data = (await res.json()) as Conversation[];
			setConversations(data);
		} catch {
			setError(t('widgetLoadError'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	const loadConversationThread = useCallback(
		async (conversationId: string) => {
			setThreadLoading(true);
			setThreadError(null);

			try {
				const res = await fetch(`/api/chat/${conversationId}`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
					cache: 'no-store',
				});

				if (!res.ok) {
					setThreadError(t('widgetThreadLoadError'));
					return;
				}

				const data = (await res.json()) as ConversationDetail;
				setActiveConversation(data);
			} catch {
				setThreadError(t('widgetThreadLoadError'));
			} finally {
				setThreadLoading(false);
			}
		},
		[t],
	);

	useEffect(() => {
		if (isChatRoute || !open) return;
		void loadConversations();
	}, [isChatRoute, open, loadConversations]);

	useEffect(() => {
		if (isChatRoute) return;
		void loadConversations();
	}, [isChatRoute, loadConversations]);

	useEffect(() => {
		if (!open) {
			setActiveConversationId(null);
			setActiveConversation(null);
			setThreadError(null);
			setComposerValue('');
			setSendingError(null);
		}
	}, [open]);

	const otherParticipant =
		activeConversation?.participants.find((p) => p.profile.id !== userId)
			?.profile ?? null;

	const threadChatConfig = useMemo<ChatConfig | null>(() => {
		if (!activeConversation) {
			return null;
		}

		const leftProfile =
			activeConversation.participants.find(
				(participant) => participant.profile.id !== userId,
			)?.profile ?? null;
		const rightProfile =
			activeConversation.messages.find((message) => message.senderId === userId)
				?.sender ?? null;

		const messages: ChatMessage[] = activeConversation.messages.map(
			(message) => {
				const isImage = isLikelyImageUrl(message.content);

				return {
					id: message.id,
					sender: message.senderId === userId ? 'right' : 'left',
					type: isImage ? 'image' : 'text',
					content: message.content,
					maxWidth: isImage ? 'max-w-xs' : 'max-w-sm',
					loader: {
						enabled: false,
						duration: 0,
					},
					imageAlt: message.sender.name ?? t('unknownUser'),
				};
			},
		);

		return {
			leftPerson: {
				name: leftProfile?.name ?? t('unknownUser'),
				avatar: leftProfile?.avatarUrl ?? FALLBACK_LEFT_AVATAR,
			},
			rightPerson: {
				name:
					rightProfile?.name ??
					(t.has('widgetCurrentUser')
						? t('widgetCurrentUser')
						: t('unknownUser')),
				avatar: rightProfile?.avatarUrl ?? FALLBACK_RIGHT_AVATAR,
			},
			messages,
		};
	}, [activeConversation, userId, t]);

	const threadUiConfig = useMemo<ChatUiConfig>(
		() => ({
			containerWidth: '100%',
			containerHeight: '100%',
			backgroundColor: '#F5EBE0',
			autoRestart: false,
			sequential: false,
			loader: {
				dotColor: '#936639',
			},
			linkBubbles: {
				backgroundColor: '#F5EBE0',
				textColor: '#936639',
				iconColor: '#936639',
				borderColor: '#F5EBE0',
			},
			leftChat: {
				backgroundColor: '#FDF6EE',
				textColor: '#582F0E',
				borderColor: '#E3D5CA',
				showBorder: true,
				nameColor: '#936639',
			},
			rightChat: {
				backgroundColor: '#EDE0D4',
				textColor: '#582F0E',
				borderColor: '#d1d1d1',
				showBorder: false,
				nameColor: '#936639',
			},
		}),
		[],
	);

	const unreadTotal = conversations.reduce(
		(total, conversation) => total + conversation.unreadCount,
		0,
	);
	const showThread = activeConversationId !== null;

	const markConversationAsRead = useCallback(async (conversationId: string) => {
		try {
			const res = await fetch(`/api/chat/${conversationId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
			});

			if (!res.ok) return;

			setConversations((prev) =>
				prev.map((conversation) =>
					conversation.id === conversationId
						? { ...conversation, unreadCount: 0 }
						: conversation,
				),
			);
		} catch {
			// Keep UI responsive even if read sync fails.
		}
	}, []);

	const handleSelectConversation = useCallback(
		async (conversationId: string) => {
			setActiveConversationId(conversationId);
			setComposerValue('');
			setSendingError(null);
			await loadConversationThread(conversationId);
			void markConversationAsRead(conversationId);
		},
		[loadConversationThread, markConversationAsRead],
	);

	const handleRealtimeMessage = useCallback(
		(payload: RealtimeMessageRow) => {
			let shouldReloadConversations = false;

			setConversations((prev) => {
				const existing = prev.find(
					(conversation) => conversation.id === payload.conversationId,
				);

				if (!existing) {
					shouldReloadConversations = true;
					return prev;
				}

				const isIncoming = payload.senderId !== userId;
				const nextUnreadCount =
					activeConversationId === payload.conversationId
						? 0
						: isIncoming
							? existing.unreadCount + 1
							: existing.unreadCount;

				const updated: Conversation = {
					...existing,
					messages: [{ content: payload.content }],
					unreadCount: nextUnreadCount,
				};

				return [
					updated,
					...prev.filter(
						(conversation) => conversation.id !== payload.conversationId,
					),
				];
			});

			if (shouldReloadConversations) {
				void loadConversations();
			}

			if (activeConversationId === payload.conversationId) {
				void loadConversationThread(payload.conversationId);
				if (payload.senderId !== userId) {
					void markConversationAsRead(payload.conversationId);
				}
			}
		},
		[
			activeConversationId,
			markConversationAsRead,
			loadConversationThread,
			loadConversations,
			userId,
		],
	);

	useEffect(() => {
		if (isChatRoute) return;

		const channel = supabase
			.channel(`chat-messages-${userId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
				},
				(payload) => {
					handleRealtimeMessage(payload.new as RealtimeMessageRow);
				},
			)
			.subscribe((status) => {
				setIsRealtimeConnected(status === 'SUBSCRIBED');
			});

		return () => {
			setIsRealtimeConnected(false);
			void supabase.removeChannel(channel);
		};
	}, [isChatRoute, supabase, userId, handleRealtimeMessage]);

	useEffect(() => {
		if (isChatRoute || isRealtimeConnected) return;

		const intervalId = window.setInterval(() => {
			if (document.visibilityState !== 'visible') return;

			void loadConversations();
			if (activeConversationId) {
				void loadConversationThread(activeConversationId);
			}
		}, 15000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [
		activeConversationId,
		isChatRoute,
		isRealtimeConnected,
		loadConversations,
		loadConversationThread,
	]);

	useEffect(() => {
		if (isChatRoute) return;

		const handleOpenWidget = (event: Event) => {
			const customEvent = event as CustomEvent<OpenFloatingChatWidgetDetail>;
			const conversationId = customEvent.detail?.conversationId;

			setOpen(true);

			if (!conversationId) {
				return;
			}

			void handleSelectConversation(conversationId);
		};

		window.addEventListener(
			OPEN_FLOATING_CHAT_WIDGET_EVENT,
			handleOpenWidget as EventListener,
		);

		return () => {
			window.removeEventListener(
				OPEN_FLOATING_CHAT_WIDGET_EVENT,
				handleOpenWidget as EventListener,
			);
		};
	}, [handleSelectConversation, isChatRoute]);

	if (isChatRoute) {
		return null;
	}

	async function handleSendMessage(e: React.FormEvent) {
		e.preventDefault();
		setSendingError(null);

		const trimmed = composerValue.trim();
		if (!trimmed) {
			setSendingError(t('messageRequired'));
			return;
		}

		if (!activeConversationId) {
			setSendingError(t('sendMessageError'));
			return;
		}

		setSending(true);

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					conversationId: activeConversationId,
					content: trimmed,
				}),
			});

			if (!res.ok) {
				setSendingError(t('sendMessageError'));
				return;
			}

			const newMessage = (await res.json()) as SentMessage;
			setComposerValue('');

			setActiveConversation((prev) => {
				if (!prev || prev.id !== activeConversationId) return prev;

				return {
					...prev,
					messages: [...prev.messages, newMessage],
				};
			});

			setConversations((prev) => {
				const found = prev.find(
					(conversation) => conversation.id === activeConversationId,
				);
				if (!found) return prev;

				const updated: Conversation = {
					...found,
					messages: [{ content: newMessage.content }],
					unreadCount: 0,
				};

				return [
					updated,
					...prev.filter(
						(conversation) => conversation.id !== activeConversationId,
					),
				];
			});
		} catch {
			setSendingError(t('sendMessageError'));
		} finally {
			setSending(false);
		}
	}

	return (
		<Sheet
			open={open}
			onOpenChange={setOpen}
		>
			<Button
				data-testid="floating-chat-open-button"
				type="button"
				size="icon"
				className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 size-12 rounded-full shadow-lg sm:right-5"
				aria-label={t('widgetOpen')}
				onClick={() => setOpen(true)}
			>
				<MessageCircleMore className="size-5" />
				<span className="sr-only">{t('widgetOpen')}</span>
				{unreadTotal > 0 ? (
					<Badge
						variant="destructive"
						className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-[10px]"
					>
						{unreadTotal > 99 ? '99+' : unreadTotal}
					</Badge>
				) : null}
			</Button>

			{!isRealtimeConnected ? (
				<p
					className="sr-only"
					role="status"
					aria-live="polite"
				>
					{widgetRealtimeFallbackText}
				</p>
			) : null}

			<SheetContent
				side="right"
				className="w-full gap-0 p-0 sm:max-w-md"
			>
				<SheetHeader className="border-b pb-4">
					{showThread ? (
						<div className="flex items-start gap-2">
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={t('widgetBack')}
								onClick={() => {
									setActiveConversationId(null);
									setActiveConversation(null);
									setThreadError(null);
									setComposerValue('');
									setSendingError(null);
								}}
							>
								<ArrowLeft className="size-4" />
								<span className="sr-only">{t('widgetBack')}</span>
							</Button>
							<div className="min-w-0">
								<SheetTitle className="truncate">
									{activeConversation?.item.title ?? t('widgetTitle')}
								</SheetTitle>
								<SheetDescription className="truncate">
									{otherParticipant?.name ?? t('unknownUser')}
								</SheetDescription>
							</div>
						</div>
					) : (
						<>
							<SheetTitle>{t('widgetTitle')}</SheetTitle>
							<SheetDescription>{t('widgetDescription')}</SheetDescription>
						</>
					)}
				</SheetHeader>

				<div className="flex min-h-0 flex-1 flex-col">
					{!showThread ? (
						<div
							className="min-h-0 flex-1 overflow-y-auto p-4"
							aria-busy={loading}
						>
							{!isRealtimeConnected ? (
								<p className="mb-3 text-xs text-muted-foreground">
									{widgetRealtimeFallbackText}
								</p>
							) : null}

							{loading ? (
								<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
									<Loader2 className="size-4 animate-spin" />
								</div>
							) : null}

							{!loading && error ? (
								<div className="grid gap-3">
									<p className="text-sm text-destructive">{error}</p>
									<Button
										type="button"
										variant="outline"
										onClick={() => void loadConversations()}
									>
										{t('widgetRetry')}
									</Button>
								</div>
							) : null}

							{!loading && !error && conversations.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									{t('widgetEmpty')}
								</p>
							) : null}

							{!loading && !error && conversations.length > 0 ? (
								<div
									className="grid gap-2"
									role="list"
									aria-label={t('widgetTitle')}
								>
									{conversations.map((conversation) => {
										const listOtherParticipant =
											conversation.participants.find(
												(p) => p.profile.id !== userId,
											)?.profile ?? null;
										const otherName =
											listOtherParticipant?.name ?? t('unknownUser');
										const lastMessage =
											conversation.messages[0]?.content ?? t('noMessagesYet');

										return (
											<div
												key={conversation.id}
												role="listitem"
											>
												<Button
													type="button"
													variant="outline"
													className="h-auto justify-start px-3 py-3"
													onClick={() =>
														void handleSelectConversation(conversation.id)
													}
												>
													<div className="flex w-full items-start gap-3 text-left">
														<Avatar className="size-9">
															<AvatarImage
																src={
																	listOtherParticipant?.avatarUrl ?? undefined
																}
																alt={otherName}
															/>
															<AvatarFallback className="text-xs">
																{getInitials(
																	listOtherParticipant?.name ?? null,
																)}
															</AvatarFallback>
														</Avatar>
														<div className="grid min-w-0 flex-1 gap-1">
															<div className="flex items-center justify-between gap-2">
																<p className="truncate text-sm font-medium">
																	{otherName}
																</p>
																{conversation.unreadCount > 0 ? (
																	<Badge
																		variant="destructive"
																		className="h-5 min-w-5 px-1 text-[10px]"
																	>
																		{conversation.unreadCount > 99
																			? '99+'
																			: conversation.unreadCount}
																	</Badge>
																) : null}
															</div>
															<p className="truncate text-xs text-muted-foreground">
																{conversation.item.title ||
																	t('widgetUnknownItem')}
															</p>
															<p className="line-clamp-2 text-xs text-muted-foreground">
																{lastMessage}
															</p>
														</div>
													</div>
												</Button>
											</div>
										);
									})}
								</div>
							) : null}
						</div>
					) : (
						<div className="flex min-h-0 flex-1 flex-col">
							<div
								className="min-h-0 flex-1 p-4"
								aria-busy={threadLoading}
							>
								{threadLoading ? (
									<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
										<Loader2 className="size-4 animate-spin" />
										<span className="sr-only">{t('widgetThreadLoading')}</span>
									</div>
								) : null}

								{!threadLoading && threadError ? (
									<div className="grid gap-3">
										<p className="text-sm text-destructive">{threadError}</p>
										{activeConversationId ? (
											<Button
												type="button"
												variant="outline"
												onClick={() =>
													void loadConversationThread(activeConversationId)
												}
											>
												{t('widgetRetry')}
											</Button>
										) : null}
									</div>
								) : null}

								{!threadLoading && !threadError && activeConversation ? (
									<div
										className="h-full"
										aria-live="polite"
									>
										{activeConversation.messages.length === 0 ||
										!threadChatConfig ? (
											<p className="text-sm text-muted-foreground">
												{t('noMessagesYet')}
											</p>
										) : (
											<ChatInterface
												config={threadChatConfig}
												uiConfig={threadUiConfig}
												containerClassName="h-full w-full"
											/>
										)}
									</div>
								) : null}
							</div>

							<div className="border-t p-4">
								<form
									onSubmit={handleSendMessage}
									className="grid gap-2"
								>
									<div className="flex gap-2">
										<label
											htmlFor="floating-chat-message-input"
											className="sr-only"
										>
											{widgetMessageInputLabel}
										</label>
										<Input
											id="floating-chat-message-input"
											value={composerValue}
											onChange={(e) => setComposerValue(e.target.value)}
											placeholder={t('messagePlaceholder')}
											maxLength={2000}
										/>
										<Button
											type="submit"
											disabled={
												sending || threadLoading || !activeConversationId
											}
										>
											{sending ? t('sending') : t('send')}
										</Button>
									</div>
									{sendingError ? (
										<p className="text-sm text-destructive">{sendingError}</p>
									) : null}
								</form>

								<Button
									type="button"
									variant="secondary"
									className="mt-3 w-full"
									onClick={() => {
										if (!activeConversationId) return;
										setOpen(false);
										router.push(`/chat/${activeConversationId}`);
									}}
								>
									{t('widgetOpenConversationPage')}
								</Button>
							</div>
						</div>
					)}

					{!showThread ? (
						<div className="border-t p-4">
							<Button
								type="button"
								variant="secondary"
								className="w-full"
								onClick={() => {
									setOpen(false);
									router.push('/chat');
								}}
							>
								{t('widgetViewAll')}
							</Button>
						</div>
					) : null}
				</div>
			</SheetContent>
		</Sheet>
	);
}
