export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			{/* TODO: Header component */}
			<main className="flex-1">{children}</main>
		</>
	);
}
