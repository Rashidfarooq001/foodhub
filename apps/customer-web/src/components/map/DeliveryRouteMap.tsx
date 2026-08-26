'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface DeliveryRouteMapProps {
  restaurantLat: number;
  restaurantLng: number;
  customerLat:   number;
  customerLng:   number;
  driverLat?:    number;
  driverLng?:    number;
  restaurantName?: string;
  routeCoordinates?: [number, number][];
}

export default function DeliveryRouteMap({
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
  driverLat,
  driverLng,
  restaurantName = 'Restaurant',
  routeCoordinates = [],
}: DeliveryRouteMapProps) {
  const mapKey = process.env.NEXT_PUBLIC_MAPPLS_WEB_KEY;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [mapState, setMapState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [errorDetails, setErrorDetails] = useState<string>('');

  const hasValidCoords = (lat?: number, lng?: number) =>
    typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const initMap = useCallback(() => {
    if (!mapContainerRef.current) {
      console.warn('[Mappls Web Map] mapContainerRef is null');
      return;
    }
    if (!window.mappls) {
      console.warn('[Mappls Web Map] window.mappls is undefined');
      return;
    }

    try {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove?.();
        } catch {
          /* ignore */
        }
        mapInstanceRef.current = null;
      }

      const restValid = hasValidCoords(restaurantLat, restaurantLng);
      const custValid = hasValidCoords(customerLat, customerLng);

      const centerLat = restValid ? restaurantLat : custValid ? customerLat : 34.3866;
      const centerLng = restValid ? restaurantLng : custValid ? customerLng : 74.5220;

      // Ensure container has dimensions
      if (mapContainerRef.current.clientHeight === 0 || mapContainerRef.current.clientWidth === 0) {
        throw new Error(`Container dimensions are 0 (w: ${mapContainerRef.current.clientWidth}, h: ${mapContainerRef.current.clientHeight})`);
      }

      const map = new window.mappls.Map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // === BASE MAP TEST ===
      /*
      if (restValid) {
        new window.mappls.Marker({
          map,
          position: { lat: restaurantLat, lng: restaurantLng },
          popupHtml: `<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#c2410c;">🏬 ${restaurantName}</div>`,
        });
      }

      if (custValid) {
        new window.mappls.Marker({
          map,
          position: { lat: customerLat, lng: customerLng },
          popupHtml: '<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#15803d;">📍 Delivery Location</div>',
        });
      }

      if (driverValid && driverLat && driverLng) {
        new window.mappls.Marker({
          map,
          position: { lat: driverLat, lng: driverLng },
          popupHtml: '<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#047857;">🚴 Rider</div>',
        });
      }

      if (routeCoordinates && routeCoordinates.length >= 2) {
        const path = routeCoordinates.map(([lat, lng]) => ({ lat, lng }));
        new window.mappls.Polyline({
          map,
          path,
          strokeColor: '#ea580c',
          strokeWeight: 5,
          strokeOpacity: 0.9,
          fitbounds: true,
        });
      }
      */

      setMapState('READY');
    } catch (err: any) {
      console.error('[Mappls DeliveryRouteMap] error:', err);
      const errStr = err?.message || String(err);
      setErrorDetails(`Init Error: ${errStr}`);
      setMapState('ERROR');
    }
  }, [restaurantLat, restaurantLng, customerLat, customerLng, driverLat, driverLng, restaurantName, routeCoordinates]);

  useEffect(() => {
    if (sdkLoaded && window.mappls && !mapInstanceRef.current) {
      initMap();
    }
  }, [sdkLoaded, initMap]);

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-gray-100 shadow-inner bg-gray-900 flex flex-col">
      <Script
        src={`https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${mapKey}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[Mappls DeliveryRouteMap] SDK Loaded');
          setSdkLoaded(true);
        }}
        onError={(e: any) => {
          console.error('[Mappls DeliveryRouteMap] Failed to load SDK:', e);
          setErrorDetails('Script Load Error: SDK failed to load. Check Network tab.');
          setMapState('ERROR');
        }}
      />

      {mapState === 'LOADING' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-900/80">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          {!mapKey && <span className="text-xs text-red-400">Warning: NEXT_PUBLIC_MAPPLS_WEB_KEY is missing!</span>}
        </div>
      )}
      {mapState === 'ERROR' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-900 p-4 text-center text-white overflow-auto">
          <AlertCircle className="h-6 w-6 text-rose-500 mx-auto shrink-0" />
          <p className="text-xs text-gray-300 font-semibold">Mappls map failed to load</p>
          <div className="bg-red-950/50 p-3 rounded-lg text-left max-w-full overflow-x-auto border border-red-900">
             <code className="text-[10px] text-red-200 whitespace-pre-wrap">{errorDetails || 'Unknown error'}</code>
          </div>
          <button
            onClick={initMap}
            className="inline-flex items-center gap-1 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 transition"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
      <div ref={mapContainerRef} className="flex-1 w-full" style={{ zIndex: 1 }} />
    </div>
  );
}
