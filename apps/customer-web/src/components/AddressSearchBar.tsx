"use client";

import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

import { getApiBaseUrl } from '@foodhub/config';

interface AddressSearchBarProps {
  onAddressSelect?: (data: { address: string; lat: number; lng: number }) => void;
}

export default function AddressSearchBar({ onAddressSelect }: AddressSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      
      setLoading(true);
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/geolocation/search?query=${encodeURIComponent(trimmed)}&q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.suggestedLocations || data.results || []);
          setResults(list);
          setIsOpen(list.length > 0);
        }
      } catch (err) {
        console.error("Mappls Search Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPlaces, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full py-1" ref={wrapperRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Search Area / Locality / Street"
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-10 font-medium focus:border-orange-500 focus:outline-none text-xs"
        />
        {loading && (
          <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-orange-500" />
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-xl text-xs">
          {results.map((place, idx) => {
            const displayName = place.displayName || place.placeName || 'Selected Location';
            const subtitle = place.placeAddress || place.displayName || '';
            const itemLat = parseFloat(place.lat ?? place.latitude ?? 0);
            const itemLng = parseFloat(place.lng ?? place.longitude ?? 0);

            return (
              <li
                key={idx}
                onClick={() => {
                  setQuery(displayName);
                  setIsOpen(false);
                  
                  if (onAddressSelect && itemLat !== 0 && itemLng !== 0) {
                    onAddressSelect({
                      address: displayName,
                      lat: itemLat,
                      lng: itemLng,
                    });
                  }
                }}
                className="cursor-pointer px-3 py-2.5 hover:bg-orange-50 flex items-start gap-2.5 transition-colors border-b border-gray-50 last:border-0"
              >
                <MapPin className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-gray-900">{displayName}</span>
                  {subtitle && subtitle !== displayName && (
                    <span className="text-[10px] leading-tight text-gray-500">{subtitle}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}