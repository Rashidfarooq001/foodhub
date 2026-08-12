'use client';

import { useEffect, useRef } from 'react';

interface DeliveryRouteMapProps {
  restaurantLat: number;
  restaurantLng: number;
  customerLat:   number;
  customerLng:   number;
  driverLat?:    number;
  driverLng?:    number;
  restaurantName?: string;
}

export default function DeliveryRouteMap({
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
  driverLat,
  driverLng,
  restaurantName = 'Restaurant',
}: DeliveryRouteMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any;

    async function initMap() {
      const L = (await import('leaflet')).default;

      // Inject Leaflet CSS once
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id    = 'leaflet-css';
        link.rel   = 'stylesheet';
        link.href  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl;

      if (!mapElRef.current) return;

      // Center map between restaurant and customer
      const centerLat = (restaurantLat + customerLat) / 2;
      const centerLng = (restaurantLng + customerLng) / 2;

      map = L.map(mapElRef.current).setView([centerLat, centerLng], 13);

      L.tileLayer('https://apis.mappls.com/advancedmaps/v1/{apiKey}/tile/{z}/{x}/{y}.png', {
        attribution: '© Mappls / MapmyIndia',
        maxZoom: 19,
        apiKey: process.env.NEXT_PUBLIC_MAPPLS_API_KEY || 'mappls',
      } as any).addTo(map);

      // Restaurant marker
      const restIcon = L.divIcon({
        className: '',
        html: `<div style="font-size:22px;text-shadow:0 1px 3px rgba(0,0,0,0.3)">🍽</div>`,
        iconAnchor: [11, 11],
      });
      L.marker([restaurantLat, restaurantLng], { icon: restIcon })
        .bindPopup(`<b>${restaurantName}</b>`)
        .addTo(map);

      // Customer marker
      const customerIcon = L.divIcon({
        className: '',
        html: `<div style="font-size:22px">🏠</div>`,
        iconAnchor: [11, 11],
      });
      L.marker([customerLat, customerLng], { icon: customerIcon })
        .bindPopup('<b>Delivery Location</b>')
        .addTo(map);

      // Driver marker (if available)
      if (driverLat !== undefined && driverLng !== undefined) {
        const driverIcon = L.divIcon({
          className: '',
          html: `<div style="font-size:22px;animation:pulse 1s infinite">🛵</div>`,
          iconAnchor: [11, 11],
        });
        L.marker([driverLat, driverLng], { icon: driverIcon })
          .bindPopup('<b>Your Delivery Partner</b>')
          .addTo(map);

        // Route polyline from driver → restaurant → customer
        L.polyline(
          [
            [driverLat,      driverLng],
            [restaurantLat,  restaurantLng],
            [customerLat,    customerLng],
          ],
          { color: '#7c3aed', weight: 3, opacity: 0.7, dashArray: '8, 6' },
        ).addTo(map);
      } else {
        // Route polyline from restaurant → customer
        L.polyline(
          [[restaurantLat, restaurantLng], [customerLat, customerLng]],
          { color: '#7c3aed', weight: 3, opacity: 0.7, dashArray: '8, 6' },
        ).addTo(map);
      }

      // Fit map to show all markers
      const bounds = L.latLngBounds([
        [restaurantLat, restaurantLng],
        [customerLat,   customerLng],
        ...(driverLat !== undefined ? [[driverLat, driverLng]] : []),
      ] as any);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    initMap();
    return () => { map?.remove(); };
  }, [restaurantLat, restaurantLng, customerLat, customerLng, driverLat, driverLng]);

  return (
    <div
      ref={mapElRef}
      className="h-72 w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
    />
  );
}
