'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface PlaceSuggestion {
  placeName: string;
  placeAddress: string;
  eLoc: string;
  latitude: number | null;
  longitude: number | null;
  type: string;
}

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
  placeholder = 'Search Kehnusa, Aloosa, Sopore, Bandipora...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/geo/search?query=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const items: PlaceSuggestion[] = data.suggestions || data.places || [];
      setSuggestions(items);
      setIsOpen(items.length > 0);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = async (suggestion: PlaceSuggestion) => {
    setQuery(suggestion.placeName);
    setIsOpen(false);
    setSuggestions([]);

    let lat = suggestion.latitude;
    let lng = suggestion.longitude;

    // If Mappls didn't return coordinates, try reverse geocoding via backend
    if (!lat || !lng) {
      try {
        const res = await fetch(`/api/geo/search?query=${encodeURIComponent(suggestion.placeName)}`);
        const data = await res.json();
        const first = (data.suggestions || [])[0];
        if (first?.latitude) { lat = first.latitude; lng = first.longitude; }
      } catch { /* ignore */ }
    }

    if (!lat || !lng) return;

    // Reverse geocode to get structured address
    try {
      const geoRes = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
      const geoData = await geoRes.json();
      onSelectPlace({
        lat: Number(lat),
        lng: Number(lng),
        address: geoData.formattedAddress || suggestion.placeAddress || suggestion.placeName,
        placeId: suggestion.eLoc || '',
        locality: geoData.locality || '',
        district: geoData.district || '',
        state: geoData.state || '',
      });
    } catch {
      onSelectPlace({
        lat: Number(lat),
        lng: Number(lng),
        address: suggestion.placeAddress || suggestion.placeName,
        placeId: suggestion.eLoc || '',
        locality: '',
        district: '',
        state: '',
      });
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative flex items-center rounded-2xl border border-gray-200 bg-gray-50 focus-within:bg-white focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100 transition">
        <Search className="h-4 w-4 text-gray-400 ml-3.5 shrink-0" />
        <input
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2.5 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        {isLoading && <Loader2 className="h-4 w-4 text-rose-600 mr-3 animate-spin shrink-0" />}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 rounded-2xl border border-gray-100 bg-white shadow-xl divide-y divide-gray-50 max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <button
              key={s.eLoc || idx}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-rose-50/50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-rose-600 shrink-0 group-hover:scale-110 transition" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{s.placeName}</p>
                  <p className="text-[10px] text-gray-500 truncate">{s.placeAddress}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
