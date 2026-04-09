export default async function EditItemPage(
	props: PageProps<'/[locale]/dashboard/items/[id]/edit'>,
) {
	const { id } = await props.params;

	return (
		<div className="container mx-auto px-4 py-8 max-w-2xl">
			<h1 className="text-3xl font-bold mb-6">Edit Item</h1>
			<p>Editing item: {id}</p>
			{/* TODO: ItemForm component (pre-filled) */}
		</div>
	);
}
