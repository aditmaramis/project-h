'use client';

import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type FC,
	type ReactNode,
	type RefObject,
	type SVGProps,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SocialButtonLabels = {
	share: string;
	twitter: string;
	instagram: string;
	linkedIn: string;
	copyLink: string;
	copySuccess: string;
};

type SocialButtonProps = {
	className?: string;
	shareUrl?: string;
	shareText?: string;
	labels?: Partial<SocialButtonLabels>;
};

type SocialOption = {
	icon: FC<SVGProps<SVGSVGElement>>;
	label: string;
	color: string;
	href: string;
};

const TwitterXIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
	<svg
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
		{...props}
	>
		<path d="M18.244 2H21.5l-7.106 8.12L22.75 22h-6.57l-5.147-6.733L4.97 22H1.71l7.6-8.687L1.25 2h6.736l4.653 6.147L18.244 2Zm-1.149 18h1.804L7.007 3.896H5.07L17.095 20Z" />
	</svg>
);

const InstagramIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
	<svg
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
		{...props}
	>
		<path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.75A4 4 0 0 0 3.75 7.75v8.5a4 4 0 0 0 4 4h8.5a4 4 0 0 0 4-4v-8.5a4 4 0 0 0-4-4h-8.5Zm8.94 1.56a1.19 1.19 0 1 1 0 2.38 1.19 1.19 0 0 1 0-2.38ZM12 7.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 1.75A2.75 2.75 0 1 0 14.75 12 2.75 2.75 0 0 0 12 9.25Z" />
	</svg>
);

const LinkedInIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
	<svg
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
		{...props}
	>
		<path d="M6.8 8.9a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8ZM5 10.4h3.6V19H5v-8.6Zm5.4 0H14v1.2h.1c.5-.9 1.7-1.5 3-1.5 3.2 0 3.9 2.1 3.9 4.8V19h-3.6v-3.7c0-.9 0-2.1-1.3-2.1-1.3 0-1.5 1-1.5 2V19h-3.6v-8.6Z" />
	</svg>
);

const defaultLabels: SocialButtonLabels = {
	share: 'Share',
	twitter: 'Twitter',
	instagram: 'Instagram',
	linkedIn: 'LinkedIn',
	copyLink: 'Copy link',
	copySuccess: 'Copied',
};

function useClickOutside(
	ref: RefObject<HTMLElement | null>,
	handler: () => void,
) {
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				handler();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [ref, handler]);
}

export function SocialButton({
	className,
	shareUrl,
	shareText,
	labels,
}: SocialButtonProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [copied, setCopied] = useState(false);
	const copyTimerRef = useRef<number | null>(null);
	const mergedLabels = { ...defaultLabels, ...labels };

	const resolvedShareUrl = useMemo(() => {
		if (typeof window === 'undefined') {
			return shareUrl ?? '';
		}

		if (!shareUrl || shareUrl.length === 0) {
			return window.location.href;
		}

		if (/^https?:\/\//i.test(shareUrl)) {
			return shareUrl;
		}

		if (shareUrl.startsWith('/')) {
			return `${window.location.origin}${shareUrl}`;
		}

		return `${window.location.origin}/${shareUrl}`;
	}, [shareUrl]);

	const shareOptions = useMemo<SocialOption[]>(() => {
		const encodedUrl = encodeURIComponent(resolvedShareUrl);
		const encodedText = encodeURIComponent(shareText ?? '');

		return [
			{
				icon: TwitterXIcon,
				label: mergedLabels.twitter,
				color: 'hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10',
				href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
			},
			{
				icon: InstagramIcon,
				label: mergedLabels.instagram,
				color: 'hover:text-[#E1306C] hover:bg-[#E1306C]/10',
				href: 'https://www.instagram.com/',
			},
			{
				icon: LinkedInIcon,
				label: mergedLabels.linkedIn,
				color: 'hover:text-[#0A66C2] hover:bg-[#0A66C2]/10',
				href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
			},
		];
	}, [
		mergedLabels.instagram,
		mergedLabels.linkedIn,
		mergedLabels.twitter,
		resolvedShareUrl,
		shareText,
	]);

	useEffect(() => {
		return () => {
			if (copyTimerRef.current !== null) {
				window.clearTimeout(copyTimerRef.current);
			}
		};
	}, []);

	const handleShareOpen =
		(href: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
			event.stopPropagation();
			window.open(href, '_blank', 'noopener,noreferrer');
		};

	const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();

		if (!resolvedShareUrl) {
			return;
		}

		try {
			await navigator.clipboard.writeText(resolvedShareUrl);
			setCopied(true);

			if (copyTimerRef.current !== null) {
				window.clearTimeout(copyTimerRef.current);
			}

			copyTimerRef.current = window.setTimeout(() => {
				setCopied(false);
			}, 2000);
		} catch {
			setCopied(false);
		}
	};

	return (
		<OnClickOutside onClickOutside={() => setIsExpanded(false)}>
			<div className={cn('flex items-center justify-center', className)}>
				<motion.div
					animate={{ width: isExpanded ? 'auto' : '120px', height: '48px' }}
					className={cn(
						'relative flex items-center overflow-hidden rounded-full border',
						'border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md',
						'dark:border-zinc-800 dark:bg-zinc-900',
					)}
					initial={false}
					onClick={() => {
						if (!isExpanded) {
							setIsExpanded(true);
						}
					}}
					transition={{ type: 'spring', stiffness: 300, damping: 25 }}
				>
					<AnimatePresence mode="sync">
						{!isExpanded ? (
							<motion.div
								key="share-text"
								className="absolute inset-0 flex items-center justify-center gap-2"
								exit={{ opacity: 0, y: -20 }}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
							>
								<Share2 className="h-4 w-4" />
								<span className="text-sm font-medium">
									{mergedLabels.share}
								</span>
							</motion.div>
						) : (
							<motion.div
								key="actions"
								className="flex items-center px-1"
								exit={{ opacity: 0, scale: 0.9 }}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.1, duration: 0.2 }}
							>
								{shareOptions.map((option) => (
									<Button
										key={option.label}
										variant="ghost"
										size="icon"
										className={cn(
											'h-10 w-10 rounded-full transition-colors',
											'text-zinc-600 dark:text-zinc-400',
											option.color,
										)}
										title={option.label}
										aria-label={option.label}
										onClick={handleShareOpen(option.href)}
									>
										<option.icon className="h-5 w-5" />
									</Button>
								))}

								<div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

								<Button
									variant="ghost"
									size="icon"
									className={cn(
										'h-10 w-10 rounded-full transition-colors',
										'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
										copied &&
											'bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-500',
									)}
									onClick={handleCopy}
									title={
										copied ? mergedLabels.copySuccess : mergedLabels.copyLink
									}
									aria-label={
										copied ? mergedLabels.copySuccess : mergedLabels.copyLink
									}
								>
									{copied ? (
										<Check className="h-5 w-5" />
									) : (
										<Copy className="h-5 w-5" />
									)}
								</Button>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</div>
		</OnClickOutside>
	);
}

interface OnClickOutsideProps {
	children: ReactNode;
	onClickOutside: () => void;
	classes?: string;
}

const OnClickOutside: FC<OnClickOutsideProps> = ({
	children,
	onClickOutside,
	classes,
}) => {
	const wrapperRef = useRef<HTMLDivElement>(null);
	useClickOutside(wrapperRef, onClickOutside);

	return (
		<div
			ref={wrapperRef}
			className={cn(classes)}
		>
			{children}
		</div>
	);
};

export default SocialButton;
