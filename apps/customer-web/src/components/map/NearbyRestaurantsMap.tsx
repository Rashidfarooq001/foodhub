'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMapplsSdk } from '../../hooks/useMapplsSdk';
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
  const { isLoaded: sdkLoaded, error: sdkError, mapKey } = useMapplsSdk();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

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
          popupHtml: `<div class="font-bold text-xs">${rest.name}<br/>${rest.distanceKm} km A ${rest.etaMinutes} mins</div>`,
        });
        if (onSelect) {
          marker.addListener('click', () => onSelect(rest));
        }
      });

      setIsLoaded(true);
    } catch (err: any) {
      console.error('Mappls NearbyRestaurantsMap error:', err);
      setErrorDetails(err.message || String(err));
    }
  };

  useEffect(() => {
    if (sdkError) {
      setErrorDetails(sdkError);
    } else if (sdkLoaded && typeof window !== 'undefined' && window.mappls && !mapInstanceRef.current) {
      initMap();
    }
  }, [sdkLoaded, sdkError]);

  if (errorDetails) return (
    <div className="relative h-[350px] w-full overflow-hidden rounded-2xl border border-red-100 bg-red-50 p-4 flex flex-col items-center justify-center text-center">
      <span className="font-bold text-red-700 text-sm mb-1">Map Error</span>
      <span className="text-red-500 text-xs">{errorDetails}</span>
    </div>
  );

  return (
    <div className="relative h-[350px] w-full overflow-hidden rounded-2xl border border-gray-100 shadow-inner">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-2 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          {!mapKey && <span className="text-xs text-red-500">Missing NEXT_PUBLIC_MAPPLS_WEB_KEY</span>}
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

