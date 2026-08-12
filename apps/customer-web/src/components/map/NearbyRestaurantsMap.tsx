'use client';

import { useEffect, useRef } from 'react';

interface RestaurantPin {
  id:          string;
  name:        string;
  slug:        string;
  lat:         number;
  lng:         number;
  avgRating:   number;
  distanceKm:  number;
  etaMinutes:  number;
}

interface NearbyRestaurantsMapProps {
  userLat:     number;
  userLng:     number;
  restaurants: RestaurantPin[];
  onSelect?:   (restaurant: RestaurantPin) => void;
}

export default function NearbyRestaurantsMap({
  userLat,
  userLng,
  restaurants,
  onSelect,
}: NearbyRestaurantsMapProps) {
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
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapElRef.current) return;

      map = L.map(mapElRef.current).setView([userLat, userLng], 13);

      L.tileLayer('https://apis.mappls.com/advancedmaps/v1/{apiKey}/tile/{z}/{x}/{y}.png', {
        attribution: '© Mappls / MapmyIndia',
        maxZoom: 19,
        apiKey: process.env.NEXT_PUBLIC_MAPPLS_API_KEY || 'mappls',
      } as any).addTo(map);

      // User location marker (blue)
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#4f46e5;border:3px solid #fff;box-shadow:0 0 0 3px #4f46e540"></div>`,
        iconAnchor: [8, 8],
      });
      L.marker([userLat, userLng], { icon: userIcon })
        .bindPopup('<b>You are here</b>')
        .addTo(map);

      // Restaurant markers
      for (const r of restaurants) {
        const restIcon = L.divIcon({
          className: '',
          html: `<div style="background:#dc2626;color:#fff;font-size:10px;font-weight:700;padding:4px 7px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2)">🍽 ${r.name.split(' ')[0]}</div>`,
          iconAnchor: [0, 0],
        });

        const marker = L.marker([r.lat, r.lng], { icon: restIcon })
          .bindPopup(
            `<b>${r.name}</b><br>⭐ ${r.avgRating} · ${r.distanceKm} km · ~${r.etaMinutes} min`,
          )
          .addTo(map);

        if (onSelect) {
          marker.on('click', () => onSelect(r));
        }
      }
    }

    initMap();
    return () => { map?.remove(); };
  }, [userLat, userLng, restaurants]);

  return (
    <div
      ref={mapElRef}
      className="h-64 w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
    />
  );
}
