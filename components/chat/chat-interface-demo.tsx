'use client';

import ChatInterface, {
	type ChatConfig,
	type UiConfig,
} from '@/components/chat/chat-interface';

export default function ChatInterfaceDemo() {
	const uiConfig: UiConfig = {
		containerWidth: 550,
		containerHeight: 450,
		backgroundColor: '#F5EBE0',
		autoRestart: true,
		restartDelay: 3000,
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
	};

	const chatConfig: ChatConfig = {
		leftPerson: {
			name: 'Tony',
			avatar:
				'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
		},
		rightPerson: {
			name: 'Brendon',
			avatar:
				'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
		},
		messages: [
			{
				id: 1,
				sender: 'left',
				type: 'text',
				content: 'Hey! Did you see the latest project updates?',
				maxWidth: 'max-w-sm',
				loader: {
					enabled: true,
					delay: 1000,
					duration: 2000,
				},
			},
			{
				id: 2,
				sender: 'right',
				type: 'text',
				content: "Not yet! What's new?",
				loader: {
					enabled: true,
					delay: 4000,
					duration: 1500,
				},
			},
			{
				id: 3,
				sender: 'left',
				type: 'text-with-links',
				content: "We're on track to complete it by the end of the quarter.",
				maxWidth: 'max-w-xs',
				links: [{ text: 'Substack' }, { text: 'YouTube' }],
				loader: {
					enabled: true,
					delay: 6000,
					duration: 1800,
				},
			},
			{
				id: 4,
				sender: 'left',
				type: 'image',
				content:
					'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=500&q=80',
				imageAlt: 'Mountain landscape',
				loader: {
					enabled: false,
					delay: 10500,
					duration: 2000,
				},
			},
			{
				id: 5,
				sender: 'right',
				type: 'text',
				content: 'These look great! Thanks for sharing.',
				loader: {
					enabled: true,
					delay: 8500,
					duration: 1200,
				},
			},
		],
	};

	return (
		<ChatInterface
			config={chatConfig}
			uiConfig={uiConfig}
		/>
	);
}
