'use client';

import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link2 } from 'lucide-react';
import Image from 'next/image';

export interface LoaderConfig {
	enabled: boolean;
	delay?: number;
	duration?: number;
}

export interface Link {
	text: string;
}

export interface Message {
	id: string | number;
	sender: 'left' | 'right';
	type: 'text' | 'image' | 'text-with-links';
	content: string;
	maxWidth?: string;
	loader?: LoaderConfig;
	links?: Link[];
	imageAlt?: string;
}

export interface Person {
	name: string;
	avatar: string;
}

export interface ChatStyle {
	backgroundColor: string;
	textColor: string;
	borderColor: string;
	showBorder: boolean;
	nameColor?: string;
}

export interface LinkBubbleStyle {
	backgroundColor: string;
	textColor: string;
	iconColor: string;
	borderColor: string;
}

export interface UiConfig {
	containerWidth?: number | string;
	containerHeight?: number | string;
	backgroundColor?: string;
	autoRestart?: boolean;
	restartDelay?: number;
	sequential?: boolean;
	loader?: {
		dotColor?: string;
	};
	linkBubbles?: LinkBubbleStyle;
	leftChat?: ChatStyle;
	rightChat?: ChatStyle;
}

export interface ChatConfig {
	leftPerson: Person;
	rightPerson: Person;
	messages: Message[];
}

interface ChatComponentProps {
	config: ChatConfig;
	uiConfig?: UiConfig;
	containerClassName?: string;
}

interface MessageLoaderProps {
	dotColor?: string;
}

interface LinkBadgeProps {
	link: Link;
	linkStyle: LinkBubbleStyle;
}

interface MessageBubbleProps {
	message: Message;
	isLeft: boolean;
	uiConfig: Required<UiConfig>;
	onContentReady?: () => void;
	isLoading: boolean;
	isVisible: boolean;
}

interface MessageWrapperProps {
	message: Message;
	config: ChatConfig;
	uiConfig: Required<UiConfig>;
	previousMessageComplete: boolean;
	onMessageComplete?: (messageId: string | number) => void;
	previousMessage: Message | null;
	nextMessage: Message | null;
	onVisibilityChange?: (messageId: string | number) => void;
	isNextVisible: boolean;
}

const hexToRgba = (hex: string, alpha: number): string => {
	if (!hex.startsWith('#') || hex.length !== 7) {
		return hex;
	}

	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const TRANSPARENT_PIXEL =
	'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';

function safeImageSrc(src: string) {
	const trimmed = src.trim();
	return trimmed.length > 0 ? trimmed : TRANSPARENT_PIXEL;
}

const MessageLoader = React.memo<MessageLoaderProps>(
	({ dotColor = '#9ca3af' }) => {
		const dotAnimation = {
			y: [0, -6, 0],
		};

		const dotTransition = (delay = 0) => ({
			duration: 0.6,
			repeat: Number.POSITIVE_INFINITY,
			ease: 'easeInOut' as const,
			delay,
		});

		return (
			<motion.div
				className="flex items-center gap-1 px-3 py-2"
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.8 }}
			>
				{[0, 0.15, 0.3].map((delay, i) => (
					<motion.div
						key={i}
						className="h-1.5 w-1.5 rounded-full"
						style={{ backgroundColor: dotColor }}
						animate={dotAnimation}
						transition={dotTransition(delay)}
					/>
				))}
			</motion.div>
		);
	},
);

MessageLoader.displayName = 'MessageLoader';

const LinkBadge = React.memo<LinkBadgeProps>(({ link, linkStyle }) => (
	<div
		className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs tracking-wider"
		style={{
			backgroundColor: linkStyle.backgroundColor,
			color: linkStyle.textColor,
			borderColor: linkStyle.borderColor,
		}}
	>
		<Link2
			size={12}
			color={linkStyle.iconColor}
		/>
		<span>{link.text}</span>
	</div>
));

LinkBadge.displayName = 'LinkBadge';

const MessageBubble = React.memo<MessageBubbleProps>(
	({ message, isLeft, uiConfig, onContentReady, isLoading, isVisible }) => {
		const [imageLoaded, setImageLoaded] = useState(false);
		const chatStyle = isLeft ? uiConfig.leftChat : uiConfig.rightChat;

		useEffect(() => {
			if (
				isVisible &&
				(message.type === 'text' || message.type === 'text-with-links')
			) {
				onContentReady?.();
			}
		}, [isVisible, message.type, onContentReady]);

		const handleImageLoad = useCallback(() => {
			setImageLoaded(true);
			onContentReady?.();
		}, [onContentReady]);

		const handleImageError = useCallback(() => {
			setImageLoaded(true);
			onContentReady?.();
		}, [onContentReady]);

		const bubbleStyle = useMemo(
			() => ({
				backgroundColor: chatStyle.backgroundColor,
				color: chatStyle.textColor,
				borderColor: chatStyle.borderColor,
				borderWidth: chatStyle.showBorder ? '0.5px' : '0',
			}),
			[
				chatStyle.backgroundColor,
				chatStyle.textColor,
				chatStyle.borderColor,
				chatStyle.showBorder,
			],
		);

		const roundedClass = isLeft
			? 'rounded-tl-lg rounded-tr-lg rounded-br-lg'
			: 'rounded-tl-lg rounded-tr-lg rounded-bl-lg';
		const paddingClass = message.type === 'image' ? 'p-1' : 'p-4';
		const maxWidthClass = message.maxWidth || 'max-w-sm';

		return (
			<div
				className={`${roundedClass} ${paddingClass} ${maxWidthClass} relative border-solid`}
				style={bubbleStyle}
			>
				<AnimatePresence mode="wait">
					{isLoading && !isVisible ? (
						<motion.div
							key="loader"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className={
								message.type === 'image'
									? 'flex items-center justify-center p-3'
									: 'flex items-center justify-center'
							}
						>
							<MessageLoader dotColor={uiConfig.loader.dotColor} />
						</motion.div>
					) : null}

					{isVisible ? (
						<motion.div
							key="content"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.3 }}
						>
							{message.type === 'text' ? (
								<p
									className="text-sm leading-relaxed"
									style={{ color: chatStyle.textColor }}
								>
									{message.content}
								</p>
							) : null}

							{message.type === 'image' ? (
								<div className="relative min-h-32">
									{!imageLoaded ? (
										<div className="flex h-32 w-full items-center justify-center">
											<MessageLoader dotColor={uiConfig.loader.dotColor} />
										</div>
									) : null}
									<Image
										src={safeImageSrc(message.content)}
										alt={message.imageAlt ?? ''}
										unoptimized
										width={192}
										height={192}
										sizes="192px"
										className={`max-h-full h-auto max-w-48 rounded object-cover ${
											!imageLoaded ? 'hidden' : ''
										}`}
										onLoad={handleImageLoad}
										onError={handleImageError}
									/>
								</div>
							) : null}

							{message.type === 'text-with-links' ? (
								<div>
									<p
										className="mb-3 text-sm leading-relaxed"
										style={{ color: chatStyle.textColor }}
									>
										{message.content}
									</p>
									<div className="flex flex-wrap gap-1">
										{message.links?.map((link, index) => (
											<LinkBadge
												key={`${message.id}-${index}`}
												link={link}
												linkStyle={uiConfig.linkBubbles}
											/>
										))}
									</div>
								</div>
							) : null}
						</motion.div>
					) : null}
				</AnimatePresence>
			</div>
		);
	},
);

MessageBubble.displayName = 'MessageBubble';

const MessageWrapper = React.memo<MessageWrapperProps>(
	({
		message,
		config,
		uiConfig,
		previousMessageComplete,
		onMessageComplete,
		previousMessage,
		nextMessage,
		onVisibilityChange,
		isNextVisible,
	}) => {
		const [isLoading, setIsLoading] = useState(false);
		const [isVisible, setIsVisible] = useState(false);
		const [messageCompleted, setMessageCompleted] = useState(false);

		const isLeft = message.sender === 'left';
		const person = isLeft ? config.leftPerson : config.rightPerson;
		const chatStyle = isLeft ? uiConfig.leftChat : uiConfig.rightChat;

		const isContinuation = previousMessage?.sender === message.sender;
		const nextMessageSameSender = nextMessage?.sender === message.sender;
		const shouldShowAvatar = !nextMessageSameSender || !isNextVisible;

		useEffect(() => {
			if (!previousMessageComplete) return;

			const { loader } = message;
			const loaderDelay = loader?.delay ?? 500;
			const totalDelay = loaderDelay + (loader?.duration || 1000);

			if (loader?.enabled) {
				const loaderTimeout = window.setTimeout(
					() => setIsLoading(true),
					loaderDelay,
				);
				const messageTimeout = window.setTimeout(() => {
					setIsLoading(false);
					setIsVisible(true);
					onVisibilityChange?.(message.id);
				}, totalDelay);

				return () => {
					window.clearTimeout(loaderTimeout);
					window.clearTimeout(messageTimeout);
				};
			}

			const messageTimeout = window.setTimeout(() => {
				setIsVisible(true);
				onVisibilityChange?.(message.id);
			}, 0);

			return () => window.clearTimeout(messageTimeout);
		}, [message, previousMessageComplete, onVisibilityChange]);

		const handleContentReady = useCallback(() => {
			if (!messageCompleted) {
				setMessageCompleted(true);
				window.setTimeout(() => onMessageComplete?.(message.id), 350);
			}
		}, [messageCompleted, onMessageComplete, message.id]);

		const messageClass = useMemo(
			() =>
				isLeft
					? 'flex items-end gap-3'
					: 'flex flex-row-reverse items-end gap-3',
			[isLeft],
		);

		if (!isLoading && !isVisible) {
			return null;
		}

		return (
			<div className={messageClass}>
				<AnimatePresence mode="wait">
					{shouldShowAvatar ? (
						<motion.div
							key="avatar"
							className="relative size-8 shrink-0 overflow-hidden rounded-full border-[1.5px] border-white"
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0 }}
							transition={{ duration: 0.2 }}
						>
							<Image
								src={safeImageSrc(person.avatar)}
								alt={person.name}
								unoptimized
								fill
								sizes="32px"
								className="object-cover"
							/>
						</motion.div>
					) : (
						<div
							className="size-8 shrink-0"
							key="spacer"
						/>
					)}
				</AnimatePresence>

				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.35, ease: 'easeOut' }}
					className="flex flex-col"
					style={{ alignItems: isLeft ? 'flex-start' : 'flex-end' }}
				>
					{!isContinuation ? (
						<motion.div
							className="mb-1 text-xs leading-relaxed"
							style={{ color: chatStyle.nameColor || '#582F0E' }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.15, duration: 0.25 }}
						>
							{person.name}
						</motion.div>
					) : null}

					<MessageBubble
						message={message}
						isLeft={isLeft}
						uiConfig={uiConfig}
						onContentReady={handleContentReady}
						isLoading={isLoading}
						isVisible={isVisible}
					/>
				</motion.div>
			</div>
		);
	},
);

MessageWrapper.displayName = 'MessageWrapper';

export default function ChatInterface({
	config,
	uiConfig = {},
	containerClassName,
}: ChatComponentProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [completedMessages, setCompletedMessages] = useState<
		Array<string | number>
	>([]);
	const [visibleMessages, setVisibleMessages] = useState<
		Array<string | number>
	>([]);
	const [key, setKey] = useState(0);

	const defaultUiConfig: Required<UiConfig> = {
		containerWidth: 400,
		containerHeight: 500,
		backgroundColor: '#ffffff',
		autoRestart: false,
		restartDelay: 3000,
		sequential: true,
		loader: { dotColor: '#9ca3af' },
		linkBubbles: {
			backgroundColor: '#f3f4f6',
			textColor: '#374151',
			iconColor: '#374151',
			borderColor: '#e5e7eb',
		},
		leftChat: {
			backgroundColor: '#ffffff',
			textColor: '#000000',
			borderColor: '#d1d1d1',
			showBorder: true,
			nameColor: '#000000',
		},
		rightChat: {
			backgroundColor: '#ffffff',
			textColor: '#000000',
			borderColor: '#d1d1d1',
			showBorder: true,
			nameColor: '#000000',
		},
	};

	const ui: Required<UiConfig> = {
		...defaultUiConfig,
		...uiConfig,
		loader: {
			...defaultUiConfig.loader,
			...(uiConfig.loader ?? {}),
		},
		linkBubbles: {
			...defaultUiConfig.linkBubbles,
			...(uiConfig.linkBubbles ?? {}),
		},
		leftChat: {
			...defaultUiConfig.leftChat,
			...(uiConfig.leftChat ?? {}),
		},
		rightChat: {
			...defaultUiConfig.rightChat,
			...(uiConfig.rightChat ?? {}),
		},
	};

	const resolvedWidth =
		typeof ui.containerWidth === 'number'
			? `${ui.containerWidth}px`
			: ui.containerWidth;
	const resolvedHeight =
		typeof ui.containerHeight === 'number'
			? `${ui.containerHeight}px`
			: ui.containerHeight;

	const handleMessageComplete = useCallback(
		(messageId: string | number) => {
			setCompletedMessages((prev) => {
				const newCompleted = [...prev, messageId];

				if (newCompleted.length === config.messages.length && ui.autoRestart) {
					window.setTimeout(() => {
						setCompletedMessages([]);
						setVisibleMessages([]);
						setKey((prevKey) => prevKey + 1);
					}, ui.restartDelay);
				}

				return newCompleted;
			});
		},
		[config.messages.length, ui.autoRestart, ui.restartDelay],
	);

	const handleVisibilityChange = useCallback((messageId: string | number) => {
		setVisibleMessages((prev) =>
			prev.includes(messageId) ? prev : [...prev, messageId],
		);
	}, []);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({
			behavior: 'smooth',
			block: 'end',
			inline: 'nearest',
		});
	}, []);

	useEffect(() => {
		const observer = new MutationObserver(scrollToBottom);

		if (containerRef.current) {
			observer.observe(containerRef.current, {
				childList: true,
				subtree: true,
			});
		}

		return () => observer.disconnect();
	}, [key, scrollToBottom]);

	useEffect(() => {
		scrollToBottom();
	}, [config.messages, completedMessages, scrollToBottom]);

	const gradientBackground = useMemo(
		() =>
			`linear-gradient(to bottom, ${hexToRgba(ui.backgroundColor, 1)} 0%, ${hexToRgba(
				ui.backgroundColor,
				0.95,
			)} 20%, ${hexToRgba(ui.backgroundColor, 0.8)} 40%, ${hexToRgba(
				ui.backgroundColor,
				0.4,
			)} 70%, ${hexToRgba(ui.backgroundColor, 0)} 100%)`,
		[ui.backgroundColor],
	);

	return (
		<div
			key={key}
			className={`relative mx-auto rounded-lg ${containerClassName ?? ''}`}
			style={{
				width: resolvedWidth,
				height: resolvedHeight,
				backgroundColor: ui.backgroundColor,
			}}
		>
			<div
				className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-32 rounded-t-lg"
				style={{ background: gradientBackground }}
			/>

			<div
				ref={containerRef}
				className="h-full overflow-y-scroll p-8"
				style={{
					scrollbarWidth: 'none',
					msOverflowStyle: 'none',
				}}
			>
				<style jsx>{`
					div::-webkit-scrollbar {
						display: none;
					}
				`}</style>

				<div className="flex min-h-full flex-col justify-end">
					{config.messages.map((message, index) => {
						const previousMessageComplete =
							!ui.sequential ||
							index === 0 ||
							completedMessages.includes(config.messages[index - 1].id);
						const previousMessage =
							index > 0 ? config.messages[index - 1] : null;
						const nextMessage =
							index < config.messages.length - 1
								? config.messages[index + 1]
								: null;
						const isNextVisible = nextMessage
							? visibleMessages.includes(nextMessage.id)
							: false;
						const isContinuation = previousMessage?.sender === message.sender;
						const spacingClass =
							index === 0 ? '' : isContinuation ? 'mt-1.5' : 'mt-8';

						return (
							<div
								key={message.id}
								className={spacingClass}
							>
								<MessageWrapper
									message={message}
									config={config}
									uiConfig={ui}
									previousMessageComplete={previousMessageComplete}
									onMessageComplete={handleMessageComplete}
									onVisibilityChange={handleVisibilityChange}
									previousMessage={previousMessage}
									nextMessage={nextMessage}
									isNextVisible={isNextVisible}
								/>
							</div>
						);
					})}
					<div
						ref={messagesEndRef}
						className="h-8"
					/>
				</div>
			</div>
		</div>
	);
}

export type { ChatComponentProps };
