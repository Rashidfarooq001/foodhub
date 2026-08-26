'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Loader2 } from 'lucide-react';

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
  const mapKey = process.env.NEXT_PUBLIC_MAPPLS_WEB_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const initMap = () => {
    if (!mapRef.current || !window.mappls || mapInstanceRef.current) return;
    try {
      const map = new window.mappls.Map(mapRef.current, {
        center: [userLat, userLng],
        zoom: 13,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // User location marker
      new window.mappls.Marker({
        map,
        position: { lat: userLat, lng: userLng },
        popupHtml: '<div class="font-bold text-xs text-blue-700">You</div>',
      });

      // Restaurant markers
      restaurants.forEach(rest => {
        const marker = new window.mappls.Marker({
          map,
          position: { lat: rest.lat, lng: rest.lng },
          popupHtml: `<div class="font-bold text-xs">${rest.name}<br/>${rest.distanceKm} km · ${rest.etaMinutes} mins</div>`,
        });
        if (onSelect) {
          marker.addListener('click', () => onSelect(rest));
        }
      });

      setIsLoaded(true);
    } catch (err) {
      console.error('Mappls NearbyRestaurantsMap error:', err);
      setError(true);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.mappls && !mapInstanceRef.current) initMap();
  });

  if (error) return <div className="text-sm text-red-500 p-4">Error loading map</div>;

  return (
    <div className="relative h-[350px] w-full overflow-hidden rounded-2xl border border-gray-100 shadow-inner">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        </div>
      )}
      <Script
        src={`https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${mapKey}`}
        strategy="afterInteractive"
        onLoad={initMap}
        onError={() => setError(true)}
      />
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

