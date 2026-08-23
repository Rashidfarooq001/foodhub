'use client';

import React, { useEffect, useRef } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface Props {
  onSelectPlace: (place: {
    lat: number;
    lng: number;
    address: string;
    placeId: string;
    locality: string;
    district: string;
    state: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export const GooglePlacesAutocomplete: React.FC<Props> = ({
  onSelectPlace,
  placeholder = "Search for a locality or street...",
  className = "",
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'in' },
    },
    debounce: 300,
    initOnMount: isLoaded,
  });

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        clearSuggestions();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clearSuggestions]);

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      
      const bestMatch = results[0];
      let locality = '';
      let district = '';
      let state = '';
      
      for (const component of bestMatch.address_components) {
        if (component.types.includes('locality')) {
          locality = component.long_name;
        } else if (component.types.includes('administrative_area_level_3')) {
          locality = locality || component.long_name;
        }
        if (component.types.includes('administrative_area_level_2')) {
          district = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
      }

      onSelectPlace({
        lat,
        lng,
        address: bestMatch.formatted_address,
        placeId: bestMatch.place_id,
        locality,
        district,
        state,
      });
    } catch (error) {
      console.error('Error fetching geocode from places', error);
    }
  };

  if (loadError) return <div className="text-red-500 text-xs">Error loading Google Maps Places.</div>;

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative flex items-center rounded-2xl border border-gray-200 bg-gray-50 focus-within:bg-white focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100 transition">
        <Search className="h-4 w-4 text-gray-400 ml-3.5 shrink-0" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder={ready ? placeholder : "Loading Maps..."}
          className="w-full bg-transparent px-3 py-2.5 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        {!ready && !loadError && <Loader2 className="h-4 w-4 text-rose-600 mr-3 animate-spin shrink-0" />}
      </div>

      {status === 'OK' && (
        <div className="absolute z-10 w-full mt-2 rounded-2xl border border-gray-100 bg-white shadow-xl divide-y divide-gray-50 max-h-60 overflow-y-auto">
          {data.map(({ place_id, description, structured_formatting }) => (
            <button
              key={place_id}
              type="button"
              onClick={() => handleSelect(description)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-rose-50/50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-rose-600 shrink-0 group-hover:scale-110 transition" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{structured_formatting.main_text}</p>
                  <p className="text-[10px] text-gray-500 truncate">{structured_formatting.secondary_text}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
