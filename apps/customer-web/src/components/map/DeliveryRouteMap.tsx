'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMapplsSdk } from '../../hooks/useMapplsSdk';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface DeliveryRouteMapProps {
  restaurantLat: number;
  restaurantLng: number;
  customerLat: number;
  customerLng: number;
  driverLat?: number;
  driverLng?: number;
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
  const { isLoaded: sdkLoaded, error: sdkError, mapKey } = useMapplsSdk();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapState, setMapState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [errorDetails, setErrorDetails] = useState<string>('');

  const hasValidCoords = (lat?: number, lng?: number) =>
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat !== 0 &&
    lng !== 0;

  const initMap = useCallback(() => {
    if (mapInstanceRef.current) {
      return;
    }

    if (!window.mappls) {
      console.warn('[Mappls Web Map] window.mappls is undefined');
      return;
    }

    const containerId = 'mappls-delivery-route-map';
    const element = document.getElementById(containerId);

    if (!element) {
      console.warn(`[Mappls Web Map] Container #${containerId} not found`);
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      console.warn(`[Mappls Web Map] Invalid dimensions: ${rect.width}x${rect.height}`);
      return;
    }

    try {
      const restValid = hasValidCoords(restaurantLat, restaurantLng);
      const custValid = hasValidCoords(customerLat, customerLng);
      const driverValid = hasValidCoords(driverLat, driverLng);

      const centerLat = restValid ? restaurantLat : custValid ? customerLat : 34.3866;
      const centerLng = restValid ? restaurantLng : custValid ? customerLng : 74.522;

      const map = new window.mappls.Map(containerId, {
        center: {
          lat: Number(centerLat),
          lng: Number(centerLng),
        },
        zoom: 13,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // === MAP MARKERS & ROUTE ENABLED ===
      const addOverlays = () => {
        try {
          /* --- MARKERS TEMPORARILY DISABLED FOR BASE MAP TEST ---
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
          } else if (restValid && custValid) {
            try {
              map.fitBounds([
                [Math.min(restaurantLat, customerLat) - 0.01, Math.min(restaurantLng, customerLng) - 0.01],
                [Math.max(restaurantLat, customerLat) + 0.01, Math.max(restaurantLng, customerLng) + 0.01],
              ]);
            } catch {
              // ignore
            }
          }
          */
          setMapState('READY');
        } catch (err: any) {
          console.error('[Mappls DeliveryRouteMap] Overlay error:', err);
          const errStr = err?.message || String(err);
          setErrorDetails(`Overlay Error: ${errStr}`);
          setMapState('ERROR');
        }
      };

      map.addListener('load', addOverlays);
    } catch (err: any) {
      console.error('[Mappls DeliveryRouteMap] error:', err);
      const errStr = err?.message || String(err);
      setErrorDetails(`Init Error: ${errStr}`);
      setMapState('ERROR');
    }
  }, [
    restaurantLat,
    restaurantLng,
    customerLat,
    customerLng,
    driverLat,
    driverLng,
    restaurantName,
    routeCoordinates,
  ]);

  useEffect(() => {
    if (sdkError) {
      setErrorDetails(sdkError);
      setMapState('ERROR');
    } else if (sdkLoaded && window.mappls && !mapInstanceRef.current) {
      initMap();
    }
  }, [sdkLoaded, sdkError, initMap]);

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-gray-100 shadow-inner bg-gray-900 flex flex-col">
      {mapState === 'LOADING' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-900/80">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          {!mapKey && (
            <span className="text-xs text-red-400">
              Warning: NEXT_PUBLIC_MAPPLS_WEB_KEY is missing!
            </span>
          )}
        </div>
      )}
      {mapState === 'ERROR' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-900 p-4 text-center text-white overflow-auto">
          <AlertCircle className="h-6 w-6 text-rose-500 mx-auto shrink-0" />
          <p className="text-xs text-gray-300 font-semibold">Mappls map failed to load</p>
          <div className="bg-red-950/50 p-3 rounded-lg text-left max-w-full overflow-x-auto border border-red-900">
            <code className="text-[10px] text-red-200 whitespace-pre-wrap">
              {errorDetails || 'Unknown error'}
            </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 transition"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
      <div
        id="mappls-delivery-route-map"
        ref={mapContainerRef}
        className="flex-1 w-full"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
