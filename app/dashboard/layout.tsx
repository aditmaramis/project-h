export default function DashboardLayout({
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
