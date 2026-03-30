'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
	items?: { id: string; title: string; latitude: number; longitude: number }[];
	center?: [number, number];
	zoom?: number;
}

export default function MapViewInner({
	items = [],
	center = [0, 0],
	zoom = 13,
}: MapViewProps) {
	return (
		<MapContainer
			center={center}
			zoom={zoom}
			className="h-[400px] w-full rounded-lg"
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			{items.map((item) => (
				<Marker
					key={item.id}
					position={[item.latitude, item.longitude]}
				>
					<Popup>{item.title}</Popup>
				</Marker>
			))}
		</MapContainer>
	);
}
