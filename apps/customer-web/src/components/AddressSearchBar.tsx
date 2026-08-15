"use client";

import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, AlertCircle } from 'lucide-react';
import { fetchLocationAutosuggest } from '@foodhub/api-client';
import { GeolocationSuggestion } from '@foodhub/types';

interface AddressSearchBarProps {
  onAddressSelect?: (data: { address: string; lat: number; lng: number }) => void;
}

export default function AddressSearchBar({ onAddressSelect }: AddressSearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeolocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      setErrorMsg(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const debounceTimer = setTimeout(async () => {
      // Cancel previous in-flight request to avoid race conditions/stale response overwriting
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const list = await fetchLocationAutosuggest(trimmed, controller.signal);
        setSuggestions(list);
        setHasSearched(true);
        setIsOpen(true);
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error("Address Search Error:", err);
          setErrorMsg("Unable to search locations. Please try again.");
          setIsOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
    };
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
          onFocus={() => { if (suggestions.length > 0 || hasSearched || errorMsg) setIsOpen(true); }}
          placeholder="Search location (e.g. Sopore, Bandipora, Srinagar...)"
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-10 font-medium focus:border-orange-500 focus:outline-none text-xs"
        />
        {loading && (
          <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-orange-500" />
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-xl text-xs">
          {errorMsg ? (
            <div className="px-3 py-3 text-amber-600 font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>{errorMsg}</span>
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {suggestions.map((item) => (
                <li
                  key={item.id}
                  onClick={() => {
                    setQuery(item.placeName || item.address);
                    setIsOpen(false);
                    
                    if (onAddressSelect && item.latitude !== 0 && item.longitude !== 0) {
                      onAddressSelect({
                        address: item.address || item.placeName,
                        lat: item.latitude,
                        lng: item.longitude,
                      });
                    }
                  }}
                  className="cursor-pointer px-3.5 py-2.5 hover:bg-orange-50 flex items-start gap-2.5 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-gray-900 leading-tight">{item.placeName}</span>
                    <span className="text-[10px] leading-tight text-gray-500">{item.address}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : hasSearched && !loading ? (
            <div className="px-3 py-3 text-gray-400 text-center font-medium">
              No locations found for &quot;{query}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}