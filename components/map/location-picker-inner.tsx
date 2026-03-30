'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
	defaultPosition?: [number, number];
	onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({
	position,
	onLocationSelect,
}: {
	position: [number, number] | null;
	onLocationSelect: (lat: number, lng: number) => void;
}) {
	const [markerPosition, setMarkerPosition] = useState(position);

	useMapEvents({
		click(e) {
			setMarkerPosition([e.latlng.lat, e.latlng.lng]);
			onLocationSelect(e.latlng.lat, e.latlng.lng);
		},
	});

	return markerPosition ? <Marker position={markerPosition} /> : null;
}

export default function LocationPickerInner({
	defaultPosition = [0, 0],
	onLocationSelect,
}: LocationPickerProps) {
	return (
		<MapContainer
			center={defaultPosition}
			zoom={13}
			className="h-[300px] w-full rounded-lg cursor-crosshair"
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<LocationMarker
				position={defaultPosition}
				onLocationSelect={onLocationSelect}
			/>
		</MapContainer>
	);
}
