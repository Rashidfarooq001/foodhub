"use client";

import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

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
      if (query.trim().length < 3) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch(`/api/mappls/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.suggestedLocations || []);
        setIsOpen(true);
      } catch (err) {
        console.error("Mappls Search Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPlaces, 400);
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
          {results.map((place, idx) => (
            <li
              key={idx}
              onClick={() => {
                const fullAddress = `${place.placeName}, ${place.placeAddress}`;
                setQuery(place.placeName);
                setIsOpen(false);
                
                if (onAddressSelect) {
                  onAddressSelect({
                    address: fullAddress,
                    lat: place.latitude,
                    lng: place.longitude,
                  });
                }
              }}
              className="cursor-pointer px-3 py-2.5 hover:bg-orange-50 flex items-start gap-2.5 transition-colors border-b border-gray-50 last:border-0"
            >
              <MapPin className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-black text-gray-900">{place.placeName}</span>
                <span className="text-[10px] leading-tight text-gray-500">{place.placeAddress}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}