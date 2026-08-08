'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  initialLat: number;
  initialLng: number;
  onSelectLocation: (lat: number, lng: number, addressStr?: string) => void;
}

export const AddressPickerMap: React.FC<Props> = ({
  initialLat,
  initialLng,
  onSelectLocation,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([initialLat, initialLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletMap.current);

      const customPin = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `<div style="background-color: #ea580c; color: white; padding: 6px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-weight: bold; font-size: 14px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">📍</div>`,
        iconSize: [36, 36],
      });

      markerRef.current = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customPin,
      }).addTo(leafletMap.current);

      markerRef.current.on('dragend', (e) => {
        const position = e.target.getLatLng();
        onSelectLocation(position.lat, position.lng);
      });

      leafletMap.current.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        markerRef.current?.setLatLng([lat, lng]);
        onSelectLocation(lat, lng);
      });
    }
  }, [initialLat, initialLng, onSelectLocation]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full min-h-[250px]" />
    </div>
  );
};
