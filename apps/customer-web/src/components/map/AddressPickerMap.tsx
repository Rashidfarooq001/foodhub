'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, X } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface AddressResult {
  lat:         number;
  lng:         number;
  displayName: string;
  placeId:     string;
}

interface AddressPickerMapProps {
  onAddressSelected: (address: { lat: number; lng: number; displayName: string }) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function AddressPickerMap({
  onAddressSelected,
  initialLat = 0,
  initialLng = 0,
}: AddressPickerMapProps) {
  const mapRef      = useRef<any>(null);
  const markerRef   = useRef<any>(null);
  const mapElRef    = useRef<HTMLDivElement>(null);

  const [query,        setQuery]        = useState('');
  const [suggestions,  setSuggestions]  = useState<AddressResult[]>([]);
  const [selectedAddr, setSelectedAddr] = useState('');
  const [markerLat,    setMarkerLat]    = useState(initialLat);
  const [markerLng,    setMarkerLng]    = useState(initialLng);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    // Dynamically import Leaflet to prevent SSR issues
    let L: any;
    let map: any;
    let marker: any;

    async function initMap() {
      const L = (await import('leaflet')).default;

      // Inject Leaflet CSS once
      if (!document.getElementById('leaflet-css')) {
        const link  = document.createElement('link');
        link.id     = 'leaflet-css';
        link.rel    = 'stylesheet';
        link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix default icon path issue in Leaflet + webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapElRef.current) return;

      map = L.map(mapElRef.current).setView([initialLat, initialLng], 15);
      mapRef.current = map;

      const mapplsKey = process.env.NEXT_PUBLIC_MAPPLS_API_KEY;
      const primaryTileUrl = mapplsKey
        ? `https://apis.mappls.com/advancedmaps/v1/${mapplsKey}/tile/{z}/{x}/{y}.png`
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(primaryTileUrl, {
        attribution: '© Mappls / MapmyIndia',
        maxZoom: 19,
        subdomains: 'abcd',
      } as any);

      tileLayer.on('tileerror', () => {
        tileLayer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      });

      tileLayer.addTo(map);

      marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Reverse geocode on drag end via backend Mappls service
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        setMarkerLat(pos.lat);
        setMarkerLng(pos.lng);
        try {
          const res = await fetch(`${API_BASE}/geolocation/reverse-geocode?lat=${pos.lat}&lng=${pos.lng}`);
          const data = await res.json();
          const address = typeof data === 'string' ? data : (data.address || data.displayName || '');
          setSelectedAddr(address);
          onAddressSelected({ lat: pos.lat, lng: pos.lng, displayName: address });
        } catch {
          /* reverse geocode fallback */
        }
      });

      // Click to move marker
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setMarkerLat(lat);
        setMarkerLng(lng);
        try {
          const res = await fetch(`${API_BASE}/geolocation/reverse-geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          const address = typeof data === 'string' ? data : (data.address || data.displayName || '');
          setSelectedAddr(address);
          onAddressSelected({ lat, lng, displayName: address });
        } catch {
          /* reverse geocode fallback */
        }
      });
    }

    initMap();
    return () => { map?.remove(); };
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/geolocation/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: AddressResult) => {
    setSuggestions([]);
    setQuery(result.displayName);
    setSelectedAddr(result.displayName);
    setMarkerLat(result.lat);
    setMarkerLng(result.lng);

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([result.lat, result.lng], 16);
      markerRef.current.setLatLng([result.lat, result.lng]);
    }

    onAddressSelected({ lat: result.lat, lng: result.lng, displayName: result.displayName });
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (mapRef.current && markerRef.current) {
        mapRef.current.setView([lat, lng], 16);
        markerRef.current.setLatLng([lat, lng]);
      }
      try {
        const res = await fetch(`${API_BASE}/geolocation/reverse-geocode?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        const address = typeof data === 'string' ? data : (data.address || data.displayName || '');
        setSelectedAddr(address);
        setQuery(address);
        onAddressSelected({ lat, lng, displayName: address });
      } catch {
        onAddressSelected({ lat, lng, displayName: 'Current Location' });
      }
    });
  };

  return (
    <div className="relative flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            id="address-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for an area, street name..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSuggestions([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        <button
          id="address-search-btn"
          onClick={handleSearch}
          disabled={loading}
          className="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Search'}
        </button>
        <button
          id="current-location-btn"
          onClick={handleCurrentLocation}
          title="Use current location"
          className="rounded-xl border border-gray-200 bg-white p-2.5 shadow hover:bg-gray-50"
        >
          <Navigation className="h-4 w-4 text-purple-600" />
        </button>
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-14 left-0 right-0 z-50 rounded-2xl border border-gray-100 bg-white shadow-xl">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              onClick={() => handleSelect(s)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-purple-50 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
              <span className="text-xs text-gray-700 leading-snug line-clamp-2">{s.displayName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <div ref={mapElRef} className="h-72 w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm" />

      {/* Selected address chip */}
      {selectedAddr && (
        <div className="flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2">
          <MapPin className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <p className="text-xs text-purple-800 line-clamp-1">{selectedAddr}</p>
        </div>
      )}
    </div>
  );
}
