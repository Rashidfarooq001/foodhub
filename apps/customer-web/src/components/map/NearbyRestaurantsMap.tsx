'use client';

import React, { useMemo } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface RestaurantPin {
  id:          string;
  name:        string;
  slug:        string;
  lat:         number;
  lng:         number;
  avgRating:   number;
  distanceKm:  number;
  etaMinutes:  number;
}

interface NearbyRestaurantsMapProps {
  userLat:     number;
  userLng:     number;
  restaurants: RestaurantPin[];
  onSelect?:   (restaurant: RestaurantPin) => void;
}

export default function NearbyRestaurantsMap({
  userLat,
  userLng,
  restaurants,
  onSelect,
}: NearbyRestaurantsMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const mapCenter = useMemo(() => ({
    lat: userLat,
    lng: userLng,
  }), [userLat, userLng]);

  if (loadError) return <div className="text-sm text-red-500 p-4">Error loading map</div>;
  if (!isLoaded) return (
    <div className="flex h-[350px] items-center justify-center bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
      <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="relative h-[350px] w-full overflow-hidden rounded-2xl border border-gray-100 shadow-inner">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={13}
        options={{ disableDefaultUI: true, zoomControl: true }}
        onLoad={(map) => {
          if (restaurants.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend({ lat: userLat, lng: userLng });
            restaurants.forEach((r) => bounds.extend({ lat: r.lat, lng: r.lng }));
            map.fitBounds(bounds);
          }
        }}
      >
        <Marker 
          position={{ lat: userLat, lng: userLng }} 
          label={{ text: "Me", color: "white", fontWeight: "bold" }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#2563eb",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 8
          }}
        />

        {restaurants.map((rest) => (
          <Marker
            key={rest.id}
            position={{ lat: rest.lat, lng: rest.lng }}
            label={{ text: rest.avgRating > 0 ? rest.avgRating.toFixed(1) : "R", color: "white", fontWeight: "bold" }}
            onClick={() => onSelect && onSelect(rest)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: "#ea580c",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#ffffff",
              scale: 10
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
