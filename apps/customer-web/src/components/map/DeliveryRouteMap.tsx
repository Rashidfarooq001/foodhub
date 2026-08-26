'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapState, setMapState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');

  const hasValidCoords = (lat?: number, lng?: number) =>
    typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const initMap = () => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const restValid = hasValidCoords(restaurantLat, restaurantLng);
      const custValid = hasValidCoords(customerLat, customerLng);
      const driverValid = hasValidCoords(driverLat, driverLng);

      const defaultLat = restValid ? restaurantLat : custValid ? customerLat : 34.3866;
      const defaultLng = restValid ? restaurantLng : custValid ? customerLng : 74.5220;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const restaurantIcon = L.divIcon({
        className: 'custom-restaurant-pin',
        html: `
          <div style="background-color:#ea580c;color:white;padding:6px;border-radius:12px;box-shadow:0 4px 10px rgba(234,88,12,0.4);border:2px solid white;display:flex;align-items:center;justify-content:center;width:32px;height:32px;transform:translate(-50%,-50%);">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const customerIcon = L.divIcon({
        className: 'custom-customer-pin',
        html: `
          <div style="background-color:#16a34a;color:white;padding:6px;border-radius:12px;box-shadow:0 4px 10px rgba(22,163,74,0.4);border:2px solid white;display:flex;align-items:center;justify-content:center;width:32px;height:32px;transform:translate(-50%,-50%);">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const driverIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: `
          <div style="background-color:#059669;color:white;padding:6px;border-radius:50%;box-shadow:0 4px 10px rgba(5,150,105,0.4);border:2px solid white;display:flex;align-items:center;justify-content:center;width:34px;height:34px;transform:translate(-50%,-50%);">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const boundsPoints: L.LatLngExpression[] = [];

      if (restValid) {
        L.marker([restaurantLat, restaurantLng], { icon: restaurantIcon })
          .addTo(map)
          .bindPopup(`<div style="font-weight:bold;font-size:12px;">${restaurantName}</div>`);
        boundsPoints.push([restaurantLat, restaurantLng]);
      }

      if (custValid) {
        L.marker([customerLat, customerLng], { icon: customerIcon })
          .addTo(map)
          .bindPopup('<div style="font-weight:bold;font-size:12px;">Delivery Location</div>');
        boundsPoints.push([customerLat, customerLng]);
      }

      if (driverValid && typeof driverLat === 'number' && typeof driverLng === 'number') {
        L.marker([driverLat, driverLng], { icon: driverIcon })
          .addTo(map)
          .bindPopup('<div style="font-weight:bold;font-size:12px;">🚴 Rider</div>');
        boundsPoints.push([driverLat, driverLng]);
      }

      const polylineCoords: [number, number][] = [];
      if (restValid) polylineCoords.push([restaurantLat, restaurantLng]);
      if (driverValid && typeof driverLat === 'number' && typeof driverLng === 'number') {
        polylineCoords.push([driverLat, driverLng]);
      }
      if (custValid) polylineCoords.push([customerLat, customerLng]);

      if (polylineCoords.length >= 2) {
        L.polyline(polylineCoords, {
          color: '#059669',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
        }).addTo(map);
      }

      if (boundsPoints.length >= 2) {
        map.fitBounds(L.latLngBounds(boundsPoints), { padding: [40, 40], maxZoom: 16 });
      }

      mapInstanceRef.current = map;
      setMapState('READY');
    } catch (err) {
      console.error('DeliveryRouteMap error:', err);
      setMapState('ERROR');
    }
  };

  useEffect(() => {
    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [restaurantLat, restaurantLng, customerLat, customerLng, driverLat, driverLng]);

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-gray-100 shadow-inner bg-gray-50">
      {mapState === 'LOADING' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        </div>
      )}
      {mapState === 'ERROR' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-50 p-4 text-center">
          <p className="text-xs text-gray-500 font-semibold">Map unavailable</p>
          <button
            onClick={initMap}
            className="inline-flex items-center gap-1 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 transition"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" style={{ zIndex: 1 }} />
    </div>
  );
}

