'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Marker as LeafletMarker } from 'leaflet';
import {
	MapContainer,
	TileLayer,
	Marker,
	useMap,
	useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
	defaultPosition?: [number, number];
	onLocationSelect: (lat: number, lng: number) => void;
	draggable?: boolean;
	heightClass?: string;
}

function LocationMarker({
	position,
	onLocationSelect,
	draggable,
}: {
	position: [number, number] | null;
	onLocationSelect: (lat: number, lng: number) => void;
	draggable: boolean;
}) {
	const markerRef = useRef<LeafletMarker | null>(null);
	const [markerPosition, setMarkerPosition] = useState(position);

	useEffect(() => {
		setMarkerPosition(position);
	}, [position]);

	const eventHandlers = useMemo(
		() => ({
			dragend() {
				const marker = markerRef.current;
				if (!marker) return;

				const nextPosition = marker.getLatLng();
				setMarkerPosition([nextPosition.lat, nextPosition.lng]);
				onLocationSelect(nextPosition.lat, nextPosition.lng);
			},
		}),
		[onLocationSelect],
	);

	useMapEvents({
		click(e) {
			setMarkerPosition([e.latlng.lat, e.latlng.lng]);
			onLocationSelect(e.latlng.lat, e.latlng.lng);
		},
	});

	return markerPosition ? (
		<Marker
			position={markerPosition}
			ref={markerRef}
			draggable={draggable}
			eventHandlers={draggable ? eventHandlers : undefined}
		/>
	) : null;
}

function UpdateMapCenter({ position }: { position: [number, number] | null }) {
	const map = useMap();

	useEffect(() => {
		if (!position) return;
		map.setView(position);
	}, [map, position]);

	return null;
}

export default function LocationPickerInner({
	defaultPosition = [0, 0],
	onLocationSelect,
	draggable = true,
	heightClass = 'h-56',
}: LocationPickerProps) {
	const initialCenter = defaultPosition ?? [0, 0];

	return (
		<MapContainer
			center={initialCenter}
			zoom={13}
			className={`${heightClass} w-full rounded-lg cursor-crosshair`}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<UpdateMapCenter position={defaultPosition} />
			<LocationMarker
				position={defaultPosition}
				onLocationSelect={onLocationSelect}
				draggable={draggable}
			/>
		</MapContainer>
	);
}
