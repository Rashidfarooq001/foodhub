'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMapplsSdk } from '../../hooks/useMapplsSdk';
import { Loader2, RefreshCw, AlertCircle, Bike } from 'lucide-react';

interface Props {
  driverLat?: number | null;
  driverLng?: number | null;
  restaurantLat: number;
  restaurantLng: number;
  customerLat: number;
  customerLng: number;
  driverName?: string;
  routeCoordinates?: [number, number][];
}

export const MapplsLiveTrackingMap: React.FC<Props> = ({
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
  driverName,
  routeCoordinates = [],
}) => {
  const { isLoaded: sdkLoaded, error: sdkError, mapKey } = useMapplsSdk();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const [mapState, setMapState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [errorDetails, setErrorDetails] = useState<string>('');

  const hasValidCoords = (lat?: number | null, lng?: number | null) =>
    typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const initMap = useCallback(() => {
    if (mapInstanceRef.current) {
      return;
    }

    if (!window.mappls) {
      console.warn('[Mappls Web Map] window.mappls is undefined');
      return;
    }

    const containerId = 'mappls-live-tracking-map';
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

      const centerLat = restValid ? restaurantLat : custValid ? customerLat : 34.3866;
      const centerLng = restValid ? restaurantLng : custValid ? customerLng : 74.5220;

      const map = new window.mappls.Map(containerId, {
        center: {
          lat: Number(centerLat),
          lng: Number(centerLng)
        },
        zoom: 13,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      const addOverlays = () => {
        try {
          // 1. Restaurant Marker
          if (restValid) {
            new window.mappls.Marker({
              map,
              position: { lat: restaurantLat, lng: restaurantLng },
              popupHtml: '<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#c2410c;padding:2px 4px;">🏪 Kitchen / Restaurant</div>',
            });
          }

          // 2. Customer Destination Marker
          if (custValid) {
            new window.mappls.Marker({
              map,
              position: { lat: customerLat, lng: customerLng },
              popupHtml: '<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#15803d;padding:2px 4px;">📍 Your Delivery Address</div>',
            });
          }

          // 3. Initial Driver Marker
          const driverValid = hasValidCoords(driverLat, driverLng);
          if (driverValid && driverLat && driverLng && !driverMarkerRef.current) {
            const dMarker = new window.mappls.Marker({
              map,
              position: { lat: driverLat, lng: driverLng },
              popupHtml: `<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#047857;padding:2px 4px;">🚴 ${driverName || 'Delivery Partner'} (Live)</div>`,
            });
            driverMarkerRef.current = dMarker;
          }

          // 4. Real Mappls Road Route Polyline
          if (routeCoordinates && routeCoordinates.length >= 2) {
            // Mappls polyline takes an array of {lat, lng} objects or similar, depending on version
            const path = routeCoordinates.map(coord => {
              if (Array.isArray(coord)) {
                return { lat: Number(coord[0]), lng: Number(coord[1]) };
              } else if (coord && typeof coord === 'object') {
                return { lat: Number((coord as any).lat), lng: Number((coord as any).lng) };
              }
              return { lat: 0, lng: 0 };
            }).filter(c => c.lat && c.lng);

            if (path.length >= 2) {
              const polyline = new window.mappls.Polyline({
                map,
                path,
              strokeColor: '#ea580c',
              strokeWeight: 5,
              strokeOpacity: 0.9,
              fitbounds: false, // We will manually compute bounds below
            });
            polylineRef.current = polyline;
          }
        }

          // 5. Automatic Viewport Fitting
          const bounds: [number, number][] = [];
          if (restValid) bounds.push([Number(restaurantLat), Number(restaurantLng)]);
          if (custValid) bounds.push([Number(customerLat), Number(customerLng)]);
          if (driverValid && driverLat && driverLng) bounds.push([Number(driverLat), Number(driverLng)]);
          if (routeCoordinates && routeCoordinates.length >= 2) {
            routeCoordinates.forEach(coord => {
              if (Array.isArray(coord)) {
                bounds.push([Number(coord[0]), Number(coord[1])]);
              } else if (coord && typeof coord === 'object') {
                bounds.push([Number((coord as any).lat), Number((coord as any).lng)]);
              }
            });
          }

          if (bounds.length > 0) {
            const minLat = Math.min(...bounds.map(b => b[0]));
            const maxLat = Math.max(...bounds.map(b => b[0]));
            const minLng = Math.min(...bounds.map(b => b[1]));
            const maxLng = Math.max(...bounds.map(b => b[1]));
            try {
              map.fitBounds([
                [minLat - 0.005, minLng - 0.005],
                [maxLat + 0.005, maxLng + 0.005]
              ]);
            } catch {
              // ignore fit bounds error
            }
          }

          setMapState('READY');
        } catch (err: any) {
          console.error('[Mappls Web Map] Overlay error:', err);
          const errStr = err?.message || String(err);
          setErrorDetails(`Overlay Error: ${errStr}`);
          setMapState('ERROR');
        }
      };

              let overlayAdded = false;
        const safeAddOverlays = () => {
          if (overlayAdded) return;
          overlayAdded = true;
          addOverlays();
        };

        if (map.isStyleLoaded && map.isStyleLoaded()) {
          safeAddOverlays();
        } else {
          if (typeof map.addListener === 'function') {
            map.addListener('load', safeAddOverlays);
          } else if (typeof map.on === 'function') {
            map.on('load', safeAddOverlays);
          }
          setTimeout(() => {
            safeAddOverlays();
          }, 1500);
        }

    } catch (err: any) {
      console.error('[Mappls Web Map] Initialization error:', err);
      const errStr = err?.message || String(err);
      setErrorDetails(`Init Error: ${errStr}`);
      setMapState('ERROR');
    }
  }, [restaurantLat, restaurantLng, customerLat, customerLng, routeCoordinates, driverName, driverLat, driverLng]);

  useEffect(() => {
    if (sdkError) {
      setErrorDetails(sdkError);
      setMapState('ERROR');
    } else if (sdkLoaded && window.mappls && !mapInstanceRef.current) {
      initMap();
    }
  }, [sdkLoaded, sdkError, initMap]);

  // Smooth real-time update of driver marker location (NO fitBounds / NO camera jump)
  useEffect(() => {
    if (!hasValidCoords(driverLat, driverLng) || !driverLat || !driverLng) return;

    if (driverMarkerRef.current) {
      try {
        driverMarkerRef.current.setPosition({ lat: driverLat, lng: driverLng });
      } catch (err) {
        console.error('[Mappls Web Map] Error updating driver marker:', err);
      }
    } else if (mapInstanceRef.current && window.mappls && mapState === 'READY') {
      try {
        const dMarker = new window.mappls.Marker({
          map: mapInstanceRef.current,
          position: { lat: driverLat, lng: driverLng },
          popupHtml: `<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#047857;padding:2px 4px;">🚴 ${driverName || 'Delivery Partner'} (Live)</div>`,
        });
        driverMarkerRef.current = dMarker;
      } catch (err) {
        console.error('[Mappls Web Map] Error creating driver marker:', err);
      }
    }
  }, [driverLat, driverLng, driverName, mapState]);

  // Handle container resize (e.g., orientation change or responsive layout shifts)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container || mapState !== 'READY') return;

    const observer = new ResizeObserver(() => {
      if (typeof map.resize === 'function') {
        map.resize();
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [mapState]);

  return (
    <div className="relative h-full w-full min-h-[350px] overflow-hidden rounded-3xl bg-gray-900 shadow-inner flex flex-col">
      {mapState === 'LOADING' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-900/80 backdrop-blur-xs text-white">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
          <span className="text-xs font-bold tracking-wide">Loading Mappls Live Map...</span>
          {!mapKey && <span className="text-xs text-red-400">Warning: NEXT_PUBLIC_MAPPLS_WEB_KEY is missing!</span>}
        </div>
      )}

      {mapState === 'ERROR' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-900 text-white p-6 text-center overflow-auto">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto shrink-0" />
          <p className="text-xs text-gray-300 font-semibold">Mappls live map failed to load</p>
          <div className="bg-red-950/50 p-3 rounded-lg text-left max-w-full overflow-x-auto border border-red-900">
             <code className="text-[10px] text-red-200 whitespace-pre-wrap">{errorDetails || 'Unknown error'}</code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tap to Retry
          </button>
        </div>
      )}

      <div id="mappls-live-tracking-map" ref={mapContainerRef} className="flex-1 w-full min-h-[350px]" style={{ zIndex: 1 }} />
    </div>
  );
};

export const LiveTrackingMap = MapplsLiveTrackingMap;
