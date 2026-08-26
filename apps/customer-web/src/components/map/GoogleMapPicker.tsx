'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Loader2 } from 'lucide-react';

interface Props {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

export const GoogleMapPicker: React.FC<Props> = ({
  initialLat,
  initialLng,
  onLocationChange,
  className = 'w-full h-[300px] rounded-xl overflow-hidden',
}) => {
  const mapKey = process.env.NEXT_PUBLIC_MAPPLS_WEB_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const centerLat = initialLat || 34.0747;
  const centerLng = initialLng || 74.8204;

  const initMap = () => {
    if (!mapRef.current || !window.mappls) return;
    try {
      const map = new window.mappls.Map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      const marker = new window.mappls.Marker({
        map,
        position: { lat: centerLat, lng: centerLng },
        draggable: true,
      });
      markerRef.current = marker;

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) onLocationChange(pos.lat, pos.lng);
      });

      map.addListener('click', (e: any) => {
        const lat = e.lngLat?.lat ?? e.latLng?.lat();
        const lng = e.lngLat?.lng ?? e.latLng?.lng();
        if (lat && lng) {
          marker.setPosition({ lat, lng });
          onLocationChange(lat, lng);
        }
      });

      setIsLoaded(true);
    } catch (err) {
      console.error('Mappls map init error:', err);
      setError(true);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.mappls && !mapInstanceRef.current) {
      initMap();
    }
  });

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-100 text-sm text-gray-500 p-6 text-center`}>
        <span className="font-bold text-gray-700 mb-2">Map Unavailable</span>
        <span>Mappls map initialization error. Please try again.</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {!isLoaded && (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
        </div>
      )}
      <Script
        src={`https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${mapKey}`}
        strategy="afterInteractive"
        onLoad={initMap}
        onError={() => setError(true)}
      />
      <div ref={mapRef} style={{ width: '100%', height: '100%', display: isLoaded ? 'block' : 'none' }} />
    </div>
  );
};

