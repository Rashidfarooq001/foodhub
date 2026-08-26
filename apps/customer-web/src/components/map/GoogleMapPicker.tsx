'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMapplsSdk } from '../../hooks/useMapplsSdk';
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
  const { isLoaded: sdkLoaded, error: sdkError, mapKey } = useMapplsSdk();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

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

      const addOverlays = () => {
        try {
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
        } catch (err: any) {
          console.error('Mappls map overlay error:', err);
          setErrorDetails(err.message || String(err));
        }
      };

      map.addListener('load', addOverlays);
    } catch (err: any) {
      console.error('Mappls map init error:', err);
      setErrorDetails(err.message || String(err));
    }
  };

  useEffect(() => {
    if (sdkError) {
      setErrorDetails(sdkError);
    } else if (sdkLoaded && typeof window !== 'undefined' && window.mappls && !mapInstanceRef.current) {
      initMap();
    }
  }, [sdkLoaded, sdkError]);

  if (errorDetails) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-red-50 border border-red-100 text-sm p-6 text-center`}>
        <span className="font-bold text-red-700 mb-2">Map Unavailable</span>
        <span className="text-red-500 text-xs">{errorDetails}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {!isLoaded && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
          {!mapKey && <span className="text-xs text-red-500">Missing NEXT_PUBLIC_MAPPLS_WEB_KEY</span>}
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', display: isLoaded ? 'block' : 'none' }} />
    </div>
  );
};

