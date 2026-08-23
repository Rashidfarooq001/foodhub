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
}

export const DeliveryMap: React.FC<Props> = ({
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const path = useMemo(() => [
    { lat: driverLat, lng: driverLng },
    { lat: restaurantLat, lng: restaurantLng },
    { lat: customerLat, lng: customerLng },
  ], [driverLat, driverLng, restaurantLat, restaurantLng, customerLat, customerLng]);

  const mapCenter = useMemo(() => ({
    lat: (driverLat + customerLat) / 2,
    lng: (driverLng + customerLng) / 2,
  }), [driverLat, driverLng, customerLat, customerLng]);

  if (!apiKey || loadError) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center bg-gray-50 rounded-3xl border border-gray-100 shadow-inner text-sm text-gray-500 p-6 text-center">
        <span className="font-bold text-gray-700 mb-2">Map Unavailable</span>
        <span>Google Maps configuration is missing or invalid. Please configure the Map API key.</span>
      </div>
    );
  }
  
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
        zoom={13}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
        }}
        onLoad={(map) => {
          const bounds = new window.google.maps.LatLngBounds();
          path.forEach(({ lat, lng }) => {
            if (lat && lng) bounds.extend(new window.google.maps.LatLng(lat, lng));
          });
          map.fitBounds(bounds);
        }}
      >
        <Marker 
          position={{ lat: restaurantLat, lng: restaurantLng }} 
          label={{ text: "R", color: "white", fontWeight: "bold" }}
        />
        <Marker 
          position={{ lat: customerLat, lng: customerLng }} 
          label={{ text: "C", color: "white", fontWeight: "bold" }}
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
