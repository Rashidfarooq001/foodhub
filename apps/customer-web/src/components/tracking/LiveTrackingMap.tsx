'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMapplsSdk } from '../../hooks/useMapplsSdk';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  driverLat?: number | null;
  driverLng?: number | null;
  restaurantLat: number;
  restaurantLng: number;
  customerLat: number;
  customerLng: number;
  driverName?: string;
  orderStatus?: string;
  routeCoordinates?: [number, number][];
}

/**
 * Validates that a coordinate pair is:
 * - Both numbers
 * - Finite (not NaN / Infinity)
 * - Within valid geographic range
 * - Not exactly (0, 0) which indicates a missing/unset value
 */
function isValidCoord(lat?: number | null, lng?: number | null): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat !== 0 &&
    lng !== 0 &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export const MapplsLiveTrackingMap: React.FC<Props> = ({
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
  driverName,
  orderStatus,
  routeCoordinates = [],
}) => {
  const { isLoaded: sdkLoaded, error: sdkError, mapKey } = useMapplsSdk();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  // Track whether the map has been initialized so we never reinit on re-render
  const mapInitializedRef = useRef(false);

  const [mapState, setMapState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [errorDetails, setErrorDetails] = useState<string>('');

  // ─── INIT MAP ────────────────────────────────────────────────────────────────
  // CRITICAL: This callback has NO dependency on any frequently-changing props
  // (driverLat/driverLng/routeCoordinates). Those are handled by separate effects.
  // This prevents the map from being destroyed and recreated on every GPS update.
  const initMap = useCallback(() => {
    // Guard: only initialize once
    if (mapInitializedRef.current || mapInstanceRef.current) return;

    if (!window.mappls) {
      console.warn('[LiveMap] window.mappls not ready');
      return;
    }

    const containerId = 'mappls-live-tracking-map';
    const element = document.getElementById(containerId);
    if (!element) {
      console.warn('[LiveMap] Container not found');
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      console.warn(`[LiveMap] Invalid dimensions: ${rect.width}x${rect.height}`);
      return;
    }

    // Mark as initialized BEFORE creating the map to prevent double-init from
    // React StrictMode double-effect invocations.
    mapInitializedRef.current = true;

    try {
      // ── Determine initial center ──────────────────────────────────────────
      // Priority: restaurant > customer > Kashmir default (we know orders are local)
      const restValid = isValidCoord(restaurantLat, restaurantLng);
      const custValid = isValidCoord(customerLat, customerLng);

      const centerLat = restValid ? restaurantLat : custValid ? customerLat : 34.3866;
      const centerLng = restValid ? restaurantLng : custValid ? customerLng : 74.522;

      const map = new window.mappls.Map(containerId, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 14,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // ── Add static markers and initial polyline ───────────────────────────
      const addOverlays = () => {
        try {
          // 1. Restaurant marker 🏪
          if (restValid) {
            new window.mappls.Marker({
              map,
              position: { lat: restaurantLat, lng: restaurantLng },
              html: `<div class="zomato-marker restaurant-marker"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg></div>`,
              offset: [0, -20],
            });
          }

          // 2. Customer delivery destination marker 📍
          if (custValid) {
            new window.mappls.Marker({
              map,
              position: { lat: customerLat, lng: customerLng },
              html: `<div class="zomato-marker customer-marker"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
              offset: [0, -20],
            });
          }

          // 3. Initial driver marker 🛵 (only if driver location is available at init time)
          const driverValid = isValidCoord(driverLat, driverLng);
          if (driverValid && driverLat != null && driverLng != null && !driverMarkerRef.current) {
            const showDriver =
              orderStatus === 'DRIVER_ASSIGNED' ||
              orderStatus === 'ARRIVED_AT_RESTAURANT' ||
              orderStatus === 'PICKED_UP' ||
              orderStatus === 'OUT_FOR_DELIVERY';

            if (showDriver) {
              driverMarkerRef.current = new window.mappls.Marker({
                map,
                position: { lat: driverLat, lng: driverLng },
                html: `<div class="zomato-rider-pulse-container"><div class="zomato-rider-pulse"></div><div class="zomato-rider-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg></div></div>`,
                offset: [0, -20],
                popupHtml: `<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#047857;padding:2px 4px;">🛵 ${driverName || 'Delivery Partner'} (Live)</div>`,
              });
            }
          }

          // 4. Initial route polyline (if available)
          _updatePolyline(map, routeCoordinates);

          // 5. Fit initial viewport to the delivery area ONCE
          _fitBoundsToDelivery(map, {
            restaurantLat, restaurantLng, restValid,
            customerLat, customerLng, custValid,
            driverLat: driverLat ?? null, driverLng: driverLng ?? null,
            routeCoordinates,
          });

          setMapState('READY');
        } catch (err: any) {
          console.error('[LiveMap] Overlay error:', err);
          setErrorDetails(`Overlay Error: ${err?.message || String(err)}`);
          setMapState('ERROR');
          mapInitializedRef.current = false; // allow retry
        }
      };

      // Mappls fires 'load' when tiles are ready; fall back to timeout
      let overlayAdded = false;
      const safeAddOverlays = () => {
        if (overlayAdded) return;
        overlayAdded = true;
        addOverlays();
      };

      if (typeof map.isStyleLoaded === 'function' && map.isStyleLoaded()) {
        safeAddOverlays();
      } else if (typeof map.on === 'function') {
        map.on('load', safeAddOverlays);
      } else if (typeof map.addListener === 'function') {
        map.addListener('load', safeAddOverlays);
      }
      // Fallback: force overlays after 1.5s in case 'load' event never fires
      setTimeout(safeAddOverlays, 1500);
    } catch (err: any) {
      console.error('[LiveMap] Init error:', err);
      setErrorDetails(`Init Error: ${err?.message || String(err)}`);
      setMapState('ERROR');
      mapInitializedRef.current = false; // allow retry
    }
  // ⚠️ INTENTIONALLY EMPTY dependency array:
  // initMap must NEVER change identity due to prop changes.
  // driverLat/driverLng/routeCoordinates are updated by dedicated effects below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── SDK LOAD TRIGGER ─────────────────────────────────────────────────────
  useEffect(() => {
    if (sdkError) {
      setErrorDetails(sdkError);
      setMapState('ERROR');
    } else if (sdkLoaded && window.mappls && !mapInitializedRef.current) {
      initMap();
    }
  }, [sdkLoaded, sdkError, initMap]);

  // ─── DRIVER MARKER LIVE UPDATE ────────────────────────────────────────────
  // Only updates the marker position — NEVER touches the camera/viewport.
  useEffect(() => {
    if (!isValidCoord(driverLat, driverLng) || driverLat == null || driverLng == null) return;
    if (!mapInstanceRef.current || mapState !== 'READY') return;

    const showDriver =
      orderStatus === 'DRIVER_ASSIGNED' ||
      orderStatus === 'ARRIVED_AT_RESTAURANT' ||
      orderStatus === 'PICKED_UP' ||
      orderStatus === 'OUT_FOR_DELIVERY';

    if (!showDriver) return;

    if (driverMarkerRef.current) {
      // Smoothly move existing marker — no map viewport change
      try {
        driverMarkerRef.current.setPosition({ lat: driverLat, lng: driverLng });
      } catch (err) {
        console.error('[LiveMap] setPosition failed:', err);
      }
    } else {
      // First driver location received after map init — create the marker now
      try {
        driverMarkerRef.current = new window.mappls.Marker({
          map: mapInstanceRef.current,
          position: { lat: driverLat, lng: driverLng },
          html: `<div class="zomato-rider-pulse-container"><div class="zomato-rider-pulse"></div><div class="zomato-rider-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg></div></div>`,
          offset: [0, -20],
          popupHtml: `<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#047857;padding:2px 4px;">🛵 ${driverName || 'Delivery Partner'} (Live)</div>`,
        });
      } catch (err) {
        console.error('[LiveMap] Driver marker create failed:', err);
      }
    }
  }, [driverLat, driverLng, driverName, orderStatus, mapState]);

  // ─── ROUTE POLYLINE UPDATE ────────────────────────────────────────────────
  // Updates the polyline when routeCoordinates change (API refetch after status change).
  // NEVER touches the camera.
  useEffect(() => {
    if (!mapInstanceRef.current || mapState !== 'READY') return;
    if (!routeCoordinates || routeCoordinates.length < 2) return;
    _updatePolyline(mapInstanceRef.current, routeCoordinates);
  }, [routeCoordinates, mapState]);

  // ─── RECENTER (explicit user action only) ────────────────────────────────
  // Only fired when the user taps the "Recenter" button — never automatically.
  useEffect(() => {
    const handleRecenter = () => {
      const map = mapInstanceRef.current;
      if (!map || mapState !== 'READY') return;

      _fitBoundsToDelivery(map, {
        restaurantLat, restaurantLng, restValid: isValidCoord(restaurantLat, restaurantLng),
        customerLat, customerLng, custValid: isValidCoord(customerLat, customerLng),
        driverLat: driverLat ?? null, driverLng: driverLng ?? null,
        routeCoordinates,
      });
    };

    window.addEventListener('recenter-rider', handleRecenter);
    return () => window.removeEventListener('recenter-rider', handleRecenter);
  }, [mapState, restaurantLat, restaurantLng, customerLat, customerLng, driverLat, driverLng, routeCoordinates]);

  // ─── RESIZE OBSERVER ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container || mapState !== 'READY') return;

    const observer = new ResizeObserver(() => {
      if (typeof map.resize === 'function') map.resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [mapState]);

  return (
    <div className="relative h-full w-full min-h-[350px] overflow-hidden rounded-2xl bg-gray-900 shadow-inner flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: `
        .zomato-marker { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white; }
        .restaurant-marker { background: #ea580c; }
        .customer-marker { background: #16a34a; }
        .zomato-rider-pulse-container { position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
        .zomato-rider-pulse { position: absolute; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; opacity: 0.4; animation: zomato-pulse 2s infinite ease-out; }
        .zomato-rider-icon { position: relative; z-index: 10; width: 34px; height: 34px; background: #2563eb; color: white; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
        @keyframes zomato-pulse { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(1.8); opacity: 0; } }
      `}} />
      {mapState === 'LOADING' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-900/80 backdrop-blur-xs text-white">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
          <span className="text-xs font-bold tracking-wide">Loading Mappls Live Map...</span>
          {!mapKey && (
            <span className="text-xs text-red-400">
              Warning: NEXT_PUBLIC_MAPPLS_WEB_KEY is missing!
            </span>
          )}
        </div>
      )}

      {mapState === 'ERROR' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-900 text-white p-4 text-center overflow-auto">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto shrink-0" />
          <p className="text-xs text-gray-300 font-semibold">Mappls live map failed to load</p>
          <div className="bg-red-950/50 p-3 rounded-lg text-left max-w-full overflow-x-auto border border-red-900">
            <code className="text-[10px] text-red-200 whitespace-pre-wrap">
              {errorDetails || 'Unknown error'}
            </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tap to Retry
          </button>
        </div>
      )}

      <div
        id="mappls-live-tracking-map"
        ref={mapContainerRef}
        className="flex-1 w-full min-h-[350px]"
        style={{ zIndex: 1 }}
      />
    </div>
  );
};

export const LiveTrackingMap = MapplsLiveTrackingMap;

// ─── PURE UTILITY HELPERS (outside component to avoid closure capture issues) ──

/**
 * Updates (or creates) the route polyline on the map.
 * Removes the old polyline first to prevent duplicates.
 * routeCoordinates are [lat, lng] pairs (already converted from GeoJSON [lng,lat]).
 */
function _updatePolyline(
  map: any,
  routeCoordinates: [number, number][],
  polylineRef?: React.MutableRefObject<any>,
) {
  if (!routeCoordinates || routeCoordinates.length < 2) return;

  // Build path validating each coordinate
  const path = routeCoordinates
    .map((coord) => {
      if (Array.isArray(coord)) {
        const lat = Number(coord[0]);
        const lng = Number(coord[1]);
        return isValidCoord(lat, lng) ? { lat, lng } : null;
      } else if (coord && typeof coord === 'object') {
        const lat = Number((coord as any).lat);
        const lng = Number((coord as any).lng);
        return isValidCoord(lat, lng) ? { lat, lng } : null;
      }
      return null;
    })
    .filter((c): c is { lat: number; lng: number } => c !== null);

  if (path.length < 2) return;

  try {
    // Remove existing polyline if any
    if (polylineRef?.current) {
      try {
        if (typeof polylineRef.current.remove === 'function') polylineRef.current.remove();
        else if (typeof polylineRef.current.setMap === 'function') polylineRef.current.setMap(null);
      } catch {}
      polylineRef.current = null;
    }

    const polyline = new window.mappls.Polyline({
      map,
      path,
      strokeColor: '#3b82f6',
      strokeWeight: 5,
      strokeOpacity: 0.9,
      fitbounds: false, // We control viewport ourselves
    });

    if (polylineRef) polylineRef.current = polyline;
  } catch (err) {
    console.error('[LiveMap] Polyline error:', err);
  }
}

interface FitBoundsOptions {
  restaurantLat: number;
  restaurantLng: number;
  restValid: boolean;
  customerLat: number;
  customerLng: number;
  custValid: boolean;
  driverLat: number | null;
  driverLng: number | null;
  routeCoordinates: [number, number][];
}

/**
 * Fits the map viewport to the relevant delivery area.
 * ONLY called on: initial map load + explicit user recenter.
 * NEVER called on automatic GPS updates.
 */
function _fitBoundsToDelivery(map: any, opts: FitBoundsOptions) {
  const bounds: [number, number][] = [];

  if (opts.restValid) bounds.push([opts.restaurantLat, opts.restaurantLng]);
  if (opts.custValid) bounds.push([opts.customerLat, opts.customerLng]);

  if (isValidCoord(opts.driverLat, opts.driverLng) && opts.driverLat != null && opts.driverLng != null) {
    bounds.push([opts.driverLat, opts.driverLng]);
  }

  // Include validated route coordinates
  if (opts.routeCoordinates && opts.routeCoordinates.length >= 2) {
    opts.routeCoordinates.forEach((coord) => {
      let lat: number, lng: number;
      if (Array.isArray(coord)) {
        lat = Number(coord[0]);
        lng = Number(coord[1]);
      } else {
        lat = Number((coord as any).lat);
        lng = Number((coord as any).lng);
      }
      if (isValidCoord(lat, lng)) {
        bounds.push([lat, lng]);
      }
    });
  }

  if (bounds.length === 0) return;

  const minLat = Math.min(...bounds.map((b) => b[0]));
  const maxLat = Math.max(...bounds.map((b) => b[0]));
  const minLng = Math.min(...bounds.map((b) => b[1]));
  const maxLng = Math.max(...bounds.map((b) => b[1]));

  // Sanity check: ensure the bounds make geographic sense
  if (!isValidCoord(minLat, minLng) || !isValidCoord(maxLat, maxLng)) return;

  const PAD = 0.005;
  try {
    map.fitBounds([
      [minLat - PAD, minLng - PAD],
      [maxLat + PAD, maxLng + PAD],
    ]);
  } catch (err) {
    console.warn('[LiveMap] fitBounds failed:', err);
  }
}
