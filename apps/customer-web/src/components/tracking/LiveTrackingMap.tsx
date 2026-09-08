'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMapplsSdk } from '../../hooks/useMapplsSdk';
import { Loader2, RefreshCw, AlertCircle, MapPin, Store, Home } from 'lucide-react';

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

function isValidCoord(lat?: number | null, lng?: number | null): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat !== 0 && lng !== 0 &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
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
  const mapInitializedRef = useRef(false);

  const [mapState, setMapState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const initMap = useCallback(() => {
    if (!sdkLoaded || !mapContainerRef.current || !window.mappls) return;
    if (mapInitializedRef.current) return;
    mapInitializedRef.current = true;

    try {
      const restValid = isValidCoord(restaurantLat, restaurantLng);
      const custValid = isValidCoord(customerLat, customerLng);
      const startLat = restValid ? restaurantLat : 28.6139;
      const startLng = restValid ? restaurantLng : 77.2090;

      const map = new window.mappls.Map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 14,
        zoomControl: false,
        location: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;

      const addOverlays = () => {
        try {
          if (restValid) {
            new window.mappls.Marker({
              map,
              position: { lat: restaurantLat, lng: restaurantLng },
              html: \<div class="zomato-marker restaurant-marker"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg></div>\,
              offset: [0, -20]
            });
          }

          if (custValid) {
            new window.mappls.Marker({
              map,
              position: { lat: customerLat, lng: customerLng },
              html: \<div class="zomato-marker customer-marker"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>\,
              offset: [0, -20]
            });
          }

          const driverValid = isValidCoord(driverLat, driverLng);
          if (driverValid && driverLat != null && driverLng != null && !driverMarkerRef.current) {
            driverMarkerRef.current = new window.mappls.Marker({
              map,
              position: { lat: driverLat, lng: driverLng },
              html: \<div class="zomato-rider-pulse-container"><div class="zomato-rider-pulse"></div><div class="zomato-rider-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg></div></div>\,
              offset: [0, -20],
              popupHtml: \<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#1e3a8a;padding:2px 4px;">\</div>\
            });
          }

          _updatePolyline(map, routeCoordinates, polylineRef);

          _fitBoundsToDelivery(map, {
            restaurantLat, restaurantLng, restValid,
            customerLat, customerLng, custValid,
            driverLat: driverLat ?? null, driverLng: driverLng ?? null,
            routeCoordinates,
          });

          setMapState('READY');
        } catch (err: any) {
          setErrorDetails(\Overlay Error: \\);
          setMapState('ERROR');
          mapInitializedRef.current = false;
        }
      };

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
      setTimeout(safeAddOverlays, 1500);
    } catch (err: any) {
      setErrorDetails(\Init Error: \\);
      setMapState('ERROR');
      mapInitializedRef.current = false;
    }
  }, []);

  useEffect(() => {
    initMap();
  }, [initMap, sdkLoaded, sdkError]);

  useEffect(() => {
    if (!isValidCoord(driverLat, driverLng) || driverLat == null || driverLng == null) return;
    if (!mapInstanceRef.current || mapState !== 'READY') return;

    if (driverMarkerRef.current) {
      try {
        driverMarkerRef.current.setPosition({ lat: driverLat, lng: driverLng });
      } catch (err) {}
    } else {
      try {
        driverMarkerRef.current = new window.mappls.Marker({
          map: mapInstanceRef.current,
          position: { lat: driverLat, lng: driverLng },
          html: \<div class="zomato-rider-pulse-container"><div class="zomato-rider-pulse"></div><div class="zomato-rider-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg></div></div>\,
          offset: [0, -20],
          popupHtml: \<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#1e3a8a;padding:2px 4px;">\</div>\
        });
      } catch (err) {}
    }
  }, [driverLat, driverLng, driverName, orderStatus, mapState]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapState !== 'READY') return;
    _updatePolyline(mapInstanceRef.current, routeCoordinates, polylineRef);
  }, [routeCoordinates, mapState]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: \
        .zomato-marker {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 3px solid white;
        }
        .restaurant-marker { background: #ea580c; }
        .customer-marker { background: #16a34a; }
        
        .zomato-rider-pulse-container {
          position: relative;
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
        }
        .zomato-rider-pulse {
          position: absolute;
          width: 100%; height: 100%;
          background: #3b82f6;
          border-radius: 50%;
          opacity: 0.4;
          animation: zomato-pulse 2s infinite ease-out;
        }
        .zomato-rider-icon {
          position: relative; z-index: 10;
          width: 34px; height: 34px;
          background: #2563eb; color: white;
          border-radius: 50%; border: 3px solid white;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        @keyframes zomato-pulse {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      \}} />

      <div className="absolute inset-0 z-0 h-full w-full bg-gray-100" ref={mapContainerRef} />

      {mapState === 'LOADING' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm font-bold text-gray-700">Loading live tracking...</span>
        </div>
      )}

      {mapState === 'ERROR' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-rose-50/95 p-4 text-center">
          <AlertCircle className="mb-2 h-8 w-8 text-rose-600" />
          <span className="font-bold text-rose-800">Map unavailable</span>
          <p className="mt-1 text-xs text-rose-600 opacity-80">{errorDetails || sdkError || 'Could not load Mappls SDK'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 flex items-center gap-1.5 rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-800 transition-colors hover:bg-rose-200"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (mapInstanceRef.current && mapState === 'READY') {
            _fitBoundsToDelivery(mapInstanceRef.current, {
              restaurantLat, restaurantLng, restValid: isValidCoord(restaurantLat, restaurantLng),
              customerLat, customerLng, custValid: isValidCoord(customerLat, customerLng),
              driverLat: isValidCoord(driverLat, driverLng) ? driverLat : null,
              driverLng: isValidCoord(driverLat, driverLng) ? driverLng : null,
              routeCoordinates,
            });
          }
        }}
        className="absolute bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-1 ring-gray-200 transition-all hover:bg-gray-50 active:scale-95"
        title="Recenter Map"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12 22 2"/></svg>
      </button>
    </>
  );
};

export const LiveTrackingMap = MapplsLiveTrackingMap;

function _updatePolyline(map: any, routeCoords: [number, number][], polylineRef?: React.MutableRefObject<any>) {
  if (!map || !routeCoords || routeCoords.length < 2) return;
  const path = routeCoords.map((coord) => ({ lat: coord[0], lng: coord[1] }));
  
  if (polylineRef && polylineRef.current) {
    polylineRef.current.setPath(path);
  } else {
    const poly = new window.mappls.Polyline({
      map,
      paths: path,
      strokeColor: '#2563eb',
      strokeOpacity: 0.9,
      strokeWeight: 5,
      fitbounds: false,
    });
    if (polylineRef) polylineRef.current = poly;
  }
}

function _fitBoundsToDelivery(map: any, data: {
  restaurantLat: number; restaurantLng: number; restValid: boolean;
  customerLat: number; customerLng: number; custValid: boolean;
  driverLat: number | null; driverLng: number | null;
  routeCoordinates: [number, number][];
}) {
  try {
    const bounds = new window.mappls.LatLngBounds();
    let hasPoints = false;

    if (data.driverLat != null && data.driverLng != null) {
      bounds.extend({ lat: data.driverLat, lng: data.driverLng });
      hasPoints = true;
    }
    if (data.restValid) {
      bounds.extend({ lat: data.restaurantLat, lng: data.restaurantLng });
      hasPoints = true;
    }
    if (data.custValid) {
      bounds.extend({ lat: data.customerLat, lng: data.customerLng });
      hasPoints = true;
    }
    if (data.routeCoordinates && data.routeCoordinates.length > 0) {
      data.routeCoordinates.forEach(coord => {
        if (isValidCoord(coord[0], coord[1])) {
          bounds.extend({ lat: coord[0], lng: coord[1] });
          hasPoints = true;
        }
      });
    }

    if (hasPoints) {
      map.fitBounds(bounds, { padding: 80, animate: true, duration: 1000 });
    }
  } catch (err) {}
}
