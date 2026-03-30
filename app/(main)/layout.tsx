export default function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			{/* TODO: Header component */}
			<main className="flex-1">{children}</main>
			{/* TODO: Footer component */}
		</>
	);
}
