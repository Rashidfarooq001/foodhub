'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Loader2 } from 'lucide-react';

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
  const mapToken = process.env.NEXT_PUBLIC_MAPPLS_MAP_TOKEN || '';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const centerLat = (restaurantLat + customerLat) / 2;
  const centerLng = (restaurantLng + customerLng) / 2;

  const initMap = () => {
    if (!mapRef.current || !window.mappls || mapInstanceRef.current) return;
    try {
      const map = new window.mappls.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 12,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Restaurant marker
      new window.mappls.Marker({
        map,
        position: { lat: restaurantLat, lng: restaurantLng },
        popupHtml: `<div class="font-bold text-xs">${restaurantName}</div>`,
      });

      // Customer marker
      new window.mappls.Marker({
        map,
        position: { lat: customerLat, lng: customerLng },
        popupHtml: '<div class="font-bold text-xs">Delivery Location</div>',
      });

      // Driver marker if available
      if (driverLat && driverLng) {
        new window.mappls.Marker({
          map,
          position: { lat: driverLat, lng: driverLng },
          popupHtml: '<div class="font-bold text-xs">Rider</div>',
        });
      }

      // Route polyline
      const path = [
        { lat: restaurantLat, lng: restaurantLng },
        ...(driverLat && driverLng ? [{ lat: driverLat, lng: driverLng }] : []),
        { lat: customerLat, lng: customerLng },
      ];
      new window.mappls.Polyline({ map, path, strokeColor: '#059669', strokeWidth: 4, strokeOpacity: 0.8 });

      setIsLoaded(true);
    } catch (err) {
      console.error('Mappls DeliveryRouteMap error:', err);
      setError(true);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.mappls && !mapInstanceRef.current) initMap();
  });

  if (!mapToken || error) {
    return (
      <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-500">
        Map unavailable
      </div>
    );
  }

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-gray-100 shadow-inner">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        </div>
      )}
      <Script
        src={`https://apis.mappls.com/advancedmaps/api/${mapToken}/map_sdk?v=3.0&layer=vector`}
        strategy="afterInteractive"
        onLoad={initMap}
        onError={() => setError(true)}
      />
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
