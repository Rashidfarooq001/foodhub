'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

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
  className = "w-full h-[300px] rounded-xl overflow-hidden",
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Default to Srinagar/Bandipora if no initial coordinates are provided
  const [markerPos, setMarkerPos] = useState({
    lat: initialLat || 34.0747,
    lng: initialLng || 74.8204,
  });

  const mapRef = useRef<google.maps.Map | null>(null);


  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      setMarkerPos({ lat: initialLat, lng: initialLng });
      if (mapRef.current) {
        mapRef.current.panTo({ lat: initialLat, lng: initialLng });
      }
    }
  }, [initialLat, initialLng]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPos({ lat, lng });
        onLocationChange(lat, lng);
      }
    },
    [onLocationChange]
  );

  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPos({ lat, lng });
        onLocationChange(lat, lng);
      }
    },
    [onLocationChange]
  );

  if (loadError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-sm text-gray-500`}>
        Error loading Google Maps.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={markerPos}
        zoom={14}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        <Marker
          position={markerPos}
          draggable={true}
          onDragEnd={onMarkerDragEnd}
        />
      </GoogleMap>
    </div>
  );
};
