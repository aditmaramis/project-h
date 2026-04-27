export const OPEN_FLOATING_CHAT_WIDGET_EVENT =
	'hibah:open-floating-chat-widget';

export type OpenFloatingChatWidgetDetail = {
	conversationId?: string;
};

export function openFloatingChatWidget(detail?: OpenFloatingChatWidgetDetail) {
	if (typeof window === 'undefined') {
		return;
	}

	window.dispatchEvent(
		new CustomEvent<OpenFloatingChatWidgetDetail>(
			OPEN_FLOATING_CHAT_WIDGET_EVENT,
			{ detail },
		),
	);
}
