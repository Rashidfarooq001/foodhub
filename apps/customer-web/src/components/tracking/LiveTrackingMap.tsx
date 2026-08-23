'use client';

import React, { useMemo } from 'react';
import { GoogleMap, Marker, Polyline, useLoadScript } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

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
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const path = useMemo(() => [
    { lat: restaurantLat, lng: restaurantLng },
    { lat: customerLat, lng: customerLng },
  ], [restaurantLat, restaurantLng, customerLat, customerLng]);

  const mapCenter = useMemo(() => ({
    lat: (driverLat + customerLat) / 2,
    lng: (driverLng + customerLng) / 2,
  }), [driverLat, driverLng, customerLat, customerLng]);

  if (loadError) return <div className="text-sm text-red-500 p-4">Error loading map</div>;
  if (!isLoaded) return (
    <div className="flex h-[400px] items-center justify-center bg-gray-50 rounded-3xl border border-gray-100 shadow-inner">
      <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-gray-100 shadow-inner min-h-[400px]">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={14}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
        }}
        onLoad={(map) => {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend({ lat: restaurantLat, lng: restaurantLng });
          bounds.extend({ lat: customerLat, lng: customerLng });
          bounds.extend({ lat: driverLat, lng: driverLng });
          map.fitBounds(bounds);
        }}
      >
        <Marker 
          position={{ lat: restaurantLat, lng: restaurantLng }} 
          label={{ text: "R", color: "white", fontWeight: "bold" }}
        />
        <Marker 
          position={{ lat: customerLat, lng: customerLng }} 
          label={{ text: "Me", color: "white", fontWeight: "bold" }}
        />
        <Marker 
          position={{ lat: driverLat, lng: driverLng }} 
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#059669",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 8
          }}
        />

        <Polyline
          path={path}
          options={{
            strokeColor: '#059669',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      </GoogleMap>
    </div>
  );
};
