'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  driverLat: number;
  driverLng: number;
  restaurantLat: number;
  restaurantLng: number;
  customerLat: number;
  customerLng: number;
  driverName?: string;
}

export const LiveTrackingMap: React.FC<Props> = ({
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
  driverName,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

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
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      // Standard High-Performance Retina Tiles (Voyager / CartoDB / OSM)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Custom SVG Icons
      const restaurantIcon = L.divIcon({
        className: 'custom-restaurant-pin',
        html: `
          <div style="background-color:#ea580c;color:white;padding:6px;border-radius:12px;box-shadow:0 4px 10px rgba(234,88,12,0.4);border:2px solid white;display:flex;align-items:center;justify-content:center;width:34px;height:34px;transform:translate(-50%,-50%);">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const customerIcon = L.divIcon({
        className: 'custom-customer-pin',
        html: `
          <div style="background-color:#16a34a;color:white;padding:6px;border-radius:12px;box-shadow:0 4px 10px rgba(22,163,74,0.4);border:2px solid white;display:flex;align-items:center;justify-content:center;width:34px;height:34px;transform:translate(-50%,-50%);">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const driverIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;transform:translate(-50%,-50%);">
            <div style="position:absolute;inset:0;border-radius:50%;background-color:rgba(5,150,105,0.3);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:relative;background-color:#059669;color:white;padding:7px;border-radius:50%;box-shadow:0 4px 12px rgba(5,150,105,0.5);border:2.5px solid white;display:flex;align-items:center;justify-content:center;width:36px;height:36px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const boundsPoints: L.LatLngExpression[] = [];

      // Add Restaurant Marker
      if (restValid) {
        L.marker([restaurantLat, restaurantLng], { icon: restaurantIcon })
          .addTo(map)
          .bindPopup('<div style="font-weight:bold;font-size:12px;color:#111827;">Kitchen / Restaurant</div>');
        boundsPoints.push([restaurantLat, restaurantLng]);
      }

      // Add Customer Marker
      if (custValid) {
        L.marker([customerLat, customerLng], { icon: customerIcon })
          .addTo(map)
          .bindPopup('<div style="font-weight:bold;font-size:12px;color:#111827;">Your Delivery Address</div>');
        boundsPoints.push([customerLat, customerLng]);
      }

      // Add Driver Marker
      if (driverValid) {
        const dMarker = L.marker([driverLat, driverLng], { icon: driverIcon })
          .addTo(map)
          .bindPopup(`<div style="font-weight:bold;font-size:12px;color:#059669;">🚴 ${driverName || 'Delivery Partner'} (Live)</div>`);
        driverMarkerRef.current = dMarker;
        boundsPoints.push([driverLat, driverLng]);
      }

      // Add Polyline
      const polylineCoords: [number, number][] = [];
      if (restValid) polylineCoords.push([restaurantLat, restaurantLng]);
      if (driverValid && (!restValid || Math.abs(driverLat - restaurantLat) > 0.0001)) {
        polylineCoords.push([driverLat, driverLng]);
      }
      if (custValid) polylineCoords.push([customerLat, customerLng]);

      if (polylineCoords.length >= 2) {
        const polyline = L.polyline(polylineCoords, {
          color: '#059669',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
        }).addTo(map);
        polylineRef.current = polyline;
      }

      if (boundsPoints.length >= 2) {
        map.fitBounds(L.latLngBounds(boundsPoints), { padding: [45, 45], maxZoom: 16 });
      }

      mapInstanceRef.current = map;
      setMapState('READY');
    } catch (err) {
      console.error('LiveTrackingMap init error:', err);
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
  }, [restaurantLat, restaurantLng, customerLat, customerLng]);

  // Real-time update of driver position
  useEffect(() => {
    if (driverMarkerRef.current && hasValidCoords(driverLat, driverLng)) {
      driverMarkerRef.current.setLatLng([driverLat, driverLng]);

      // Update polyline if exists
      if (polylineRef.current && mapInstanceRef.current) {
        const restValid = hasValidCoords(restaurantLat, restaurantLng);
        const custValid = hasValidCoords(customerLat, customerLng);
        const newCoords: [number, number][] = [];
        if (restValid) newCoords.push([restaurantLat, restaurantLng]);
        newCoords.push([driverLat, driverLng]);
        if (custValid) newCoords.push([customerLat, customerLng]);
        if (newCoords.length >= 2) {
          polylineRef.current.setLatLngs(newCoords);
        }
      }
    }
  }, [driverLat, driverLng]);

  return (
    <div className="relative h-full w-full min-h-[350px] overflow-hidden rounded-3xl bg-gray-900 shadow-inner">
      {mapState === 'LOADING' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-900/80 backdrop-blur-xs text-white">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
          <span className="text-xs font-bold tracking-wide">Loading Live Tracking Map...</span>
        </div>
      )}

      {mapState === 'ERROR' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-900 text-white p-6 text-center">
          <p className="text-xs text-gray-400 font-semibold">Map initialization encountered an issue</p>
          <button
            onClick={initMap}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tap to Reload Map
          </button>
        </div>
      )}

      <div ref={mapContainerRef} className="h-full w-full min-h-[350px]" style={{ zIndex: 1 }} />
    </div>
  );
};

