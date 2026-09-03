'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { Loader2 } from 'lucide-react';

interface Props {
  driverLat: number;
  driverLng: number;
  restaurantLat: number;
  restaurantLng: number;
  customerLat: number;
  customerLng: number;
  status: string;
}

export const DeliveryMap: React.FC<Props> = ({
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
  status,
}) => {
  const mapToken = process.env.NEXT_PUBLIC_MAPPLS_MAP_TOKEN || '';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const driverMarkerRef = useRef<any>(null);
  const directionPluginRef = useRef<any>(null);
  const lastRoutedCoords = useRef<{lat: number, lng: number} | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isPluginLoaded, setIsPluginLoaded] = useState(false);
  const [error, setError] = useState(false);

  const centerLat = driverLat || restaurantLat || customerLat;
  const centerLng = driverLng || restaurantLng || customerLng;

  const initMap = useCallback(() => {
    if (mapInstanceRef.current || !window.mappls) return;

    const containerId = 'mappls-delivery-map-' + Math.random().toString(36).substr(2, 9);
    if (mapRef.current) mapRef.current.id = containerId;

    try {
      const map = new window.mappls.Map(containerId, {
        center: { lat: Number(centerLat), lng: Number(centerLng) },
        zoom: 14,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      map.addListener('load', () => {
        setIsMapLoaded(true);
      });
    } catch (err) {
      console.error('Mappls DeliveryMap error:', err);
      setError(true);
    }
  }, [centerLat, centerLng]);

  // Update Rider Marker instantly without redrawing the whole route
  useEffect(() => {
    if (!isMapLoaded || !window.mappls || !mapInstanceRef.current || !driverLat || !driverLng) return;

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new window.mappls.Marker({
        map: mapInstanceRef.current,
        position: { lat: driverLat, lng: driverLng },
        popupHtml: '<div class="text-xs font-bold text-blue-700">You (Rider)</div>',
      });
    } else {
      driverMarkerRef.current.setPosition({ lat: driverLat, lng: driverLng });
    }
  }, [driverLat, driverLng, isMapLoaded]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in metres
  };

  const drawRoute = useCallback(() => {
    if (!mapInstanceRef.current || !window.mappls || !window.mappls.direction || !isMapLoaded || !isPluginLoaded) return;
    if (!driverLat || !driverLng) return;

    // Only redraw route if moved more than 50 meters or no route exists
    if (lastRoutedCoords.current) {
      const dist = calculateDistance(driverLat, driverLng, lastRoutedCoords.current.lat, lastRoutedCoords.current.lng);
      if (dist < 50 && directionPluginRef.current) {
        return; // Skip redrawing route to prevent flickering
      }
    }

    if (directionPluginRef.current) {
      try { directionPluginRef.current.remove(); } catch (e) {}
    }

    const isBeforePickup = ['DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT'].includes(status);
    const destLat = isBeforePickup ? restaurantLat : customerLat;
    const destLng = isBeforePickup ? restaurantLng : customerLng;

    if (!destLat || !destLng) return;

    try {
      directionPluginRef.current = new window.mappls.direction({
        map: mapInstanceRef.current,
        start: { label: 'Start', geoposition: `${driverLat},${driverLng}` },
        end: { label: isBeforePickup ? 'Restaurant' : 'Customer', geoposition: `${destLat},${destLng}` },
        profile: 'driving',
        zoom: true,
      });
      lastRoutedCoords.current = { lat: driverLat, lng: driverLng };
    } catch(err) {
      console.error('Mappls Direction Plugin error:', err);
    }
  }, [driverLat, driverLng, restaurantLat, restaurantLng, customerLat, customerLng, status, isMapLoaded, isPluginLoaded]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.mappls) initMap();
  }, [initMap]);

  useEffect(() => {
    drawRoute();
  }, [drawRoute]);

  if (!mapToken || error) {
    return (
      <div className="flex flex-col h-[300px] sm:h-[400px] items-center justify-center bg-gray-50 rounded-2xl border border-gray-100 shadow-inner text-sm text-gray-500 p-6 text-center">
        <span className="font-bold text-gray-700 mb-2">Map Unavailable</span>
        <span>Please configure NEXT_PUBLIC_MAPPLS_MAP_TOKEN.</span>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] sm:h-[400px] w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm mt-4">
      {(!isMapLoaded || !isPluginLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        </div>
      )}
      <Script
        src={`https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${mapToken}`}
        strategy="afterInteractive"
        onLoad={initMap}
        onError={() => setError(true)}
      />
      <Script
        src={`https://sdk.mappls.com/map/sdk/plugins?v=3.0&access_token=${mapToken}&libraries=direction`}
        strategy="afterInteractive"
        onLoad={() => setIsPluginLoaded(true)}
      />
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
