'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  driverLat: number;
  driverLng: number;
  restaurantLat: number;
  restaurantLng: number;
  customerLat: number;
  customerLng: number;
}

export const DeliveryMap: React.FC<Props> = ({
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([driverLat, driverLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletMap.current);
    }

    const map = leafletMap.current;

    const restaurantIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `<div style="background-color: #ea580c; color: white; padding: 6px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-weight: bold; font-size: 10px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">🏪</div>`,
      iconSize: [32, 32],
    });

    const driverIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `<div style="background-color: #059669; color: white; padding: 6px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-weight: bold; font-size: 10px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">🛵</div>`,
      iconSize: [36, 36],
    });

    const customerIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `<div style="background-color: #2563eb; color: white; padding: 6px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-weight: bold; font-size: 10px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">📍</div>`,
      iconSize: [32, 32],
    });

    L.marker([restaurantLat, restaurantLng], { icon: restaurantIcon }).addTo(map);
    L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map);
    L.marker([customerLat, customerLng], { icon: customerIcon }).addTo(map);

    const latlngs: L.LatLngExpression[] = [
      [driverLat, driverLng],
      [restaurantLat, restaurantLng],
      [customerLat, customerLng],
    ];

    const polyline = L.polyline(latlngs, { color: '#059669', weight: 5, dashArray: '6, 6' }).addTo(map);
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  }, [driverLat, driverLng, restaurantLat, restaurantLng, customerLat, customerLng]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-gray-100 shadow-inner min-h-[400px]">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};
