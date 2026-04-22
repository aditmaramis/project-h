import { createClient } from '@/lib/supabase/server';
import { FloatingChatWidget } from '@/components/chat/floating-chat-widget';

export async function FloatingChatWidgetServer() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return null;
	}

	return <FloatingChatWidget userId={user.id} />;
}
