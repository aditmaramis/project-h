export default async function ItemDetailPage(props: PageProps<'/items/[id]'>) {
	const { id } = await props.params;

	return (
		<div className="container mx-auto px-4 py-8">
			<p>Item ID: {id}</p>
			{/* TODO: ItemDetail component */}
		</div>
	);
}
