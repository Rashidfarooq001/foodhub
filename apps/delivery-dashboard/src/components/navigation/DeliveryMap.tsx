'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Loader2 } from 'lucide-react';

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
  const mapToken = process.env.NEXT_PUBLIC_MAPPLS_MAP_TOKEN || '';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const centerLat = (driverLat + customerLat) / 2;
  const centerLng = (driverLng + customerLng) / 2;

  const initMap = () => {
    if (mapInstanceRef.current) return;
    if (!window.mappls) return;

    const containerId = 'mappls-delivery-map';
    const element = document.getElementById(containerId);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    try {
      const map = new window.mappls.Map(containerId, {
        center: { lat: Number(centerLat), lng: Number(centerLng) },
        zoom: 13,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      const addOverlays = () => {
        try {
          /* --- MARKERS TEMPORARILY DISABLED FOR BASE MAP TEST ---
          // Restaurant marker
          new window.mappls.Marker({
            map,
            position: { lat: restaurantLat, lng: restaurantLng },
            popupHtml: '<div class="font-bold text-xs text-orange-700">Restaurant</div>',
          });

          // Customer marker
          new window.mappls.Marker({
            map,
            position: { lat: customerLat, lng: customerLng },
            popupHtml: '<div class="font-bold text-xs text-emerald-700">Customer</div>',
          });

          // Driver marker
          driverMarkerRef.current = new window.mappls.Marker({
            map,
            position: { lat: driverLat, lng: driverLng },
            popupHtml: '<div class="font-bold text-xs text-blue-700">You</div>',
          });

          // Route polyline: driver -> restaurant -> customer
          new window.mappls.Polyline({
            map,
            path: [
              { lat: driverLat, lng: driverLng },
              { lat: restaurantLat, lng: restaurantLng },
              { lat: customerLat, lng: customerLng },
            ],
            strokeColor: '#059669',
            strokeWidth: 4,
            strokeOpacity: 0.8,
          });
          */
          setIsLoaded(true);
        } catch (err: any) {
          console.error('Mappls DeliveryMap overlay error:', err);
          setError(true);
        }
      };

      map.addListener('load', addOverlays);
    } catch (err) {
      console.error('Mappls DeliveryMap error:', err);
      setError(true);
    }
  };

  // Live update driver marker as GPS changes
  useEffect(() => {
    if (driverMarkerRef.current && driverLat && driverLng) {
      driverMarkerRef.current.setPosition({ lat: driverLat, lng: driverLng });
    }
  }, [driverLat, driverLng]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.mappls && !mapInstanceRef.current) initMap();
  });

  if (!mapToken || error) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center bg-gray-50 rounded-3xl border border-gray-100 shadow-inner text-sm text-gray-500 p-6 text-center">
        <span className="font-bold text-gray-700 mb-2">Map Unavailable</span>
        <span>
          Mappls map configuration is missing. Please configure NEXT_PUBLIC_MAPPLS_MAP_TOKEN.
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-gray-100 shadow-inner min-h-[400px]">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        </div>
      )}
      <Script
        src={`https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${mapToken}`}
        strategy="afterInteractive"
        onLoad={initMap}
        onError={() => setError(true)}
      />
      <div id="mappls-delivery-map" ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
