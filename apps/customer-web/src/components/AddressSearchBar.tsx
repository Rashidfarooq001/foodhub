"use client";

import { useEffect, useState } from 'react';
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete';
import '@geoapify/geocoder-autocomplete/styles/minimal.css'; 

interface AddressSearchBarProps {
  onAddressSelect?: (data: { address: string; lat: number; lng: number }) => void;
}

export default function AddressSearchBar({ onAddressSelect }: AddressSearchBarProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div style={{ width: '100%', padding: '10px 0' }}>
      {/* Rendering the context only after mount fixes the React #418 error! */}
      {isMounted && (
        <GeoapifyContext apiKey={process.env.NEXT_PUBLIC_GEOAPIFY_KEY!}>
          <GeoapifyGeocoderAutocomplete 
            placeholder="Search area (e.g., Watlab, Sopore)..."
            placeSelect={(value: any) => {
              if (value && onAddressSelect) {
                onAddressSelect({ 
                  address: value.properties.formatted, 
                  lat: value.properties.lat, 
                  lng: value.properties.lon 
                });
              }
            }}
            limit={5}
            filterByCountryCode={['in']}
            // Prioritize results near Sopore/Bandipora coordinates
            biasByProximity={{ lon: 74.64, lat: 34.33 }} 
          />
        </GeoapifyContext>
      )}
    </div>
  );
}