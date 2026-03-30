export default async function ConversationPage(
	props: PageProps<'/chat/[conversationId]'>,
) {
	const { conversationId } = await props.params;

	return (
		<div className="container mx-auto px-4 py-8 h-full">
			<p>Conversation: {conversationId}</p>
			{/* TODO: ChatWindow component */}
		</div>
	);
}
