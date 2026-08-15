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
      {/* Map Header / Helper banner */}
      <div className="flex items-center justify-between rounded-xl bg-orange-50 px-3.5 py-2.5 text-xs text-orange-900 border border-orange-100">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-600 shrink-0" />
          <span className="font-semibold text-gray-800">Tap or drag pin to select exact delivery point</span>
        </div>
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="flex items-center gap-1 font-bold text-orange-700 hover:text-orange-800 bg-white px-2.5 py-1 rounded-lg shadow-xs border border-orange-200"
        >
          <Navigation className="h-3.5 w-3.5 text-orange-600" />
          <span>My GPS</span>
        </button>
      </div>

      {/* Map Container */}
      <div ref={mapElRef} className="h-72 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0" />

      {/* Selected Address Preview Chip */}
      {selectedAddr ? (
        <div className="flex items-start gap-2 rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs">
          <MapPin className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-gray-900 leading-snug">{selectedAddr}</span>
            {markerLat !== 0 && markerLng !== 0 && (
              <span className="text-[10px] text-gray-500 font-mono">
                Coordinates: {markerLat.toFixed(4)}, {markerLng.toFixed(4)}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-xs text-gray-400 py-1 font-medium">
          Move pin on map to set delivery address
        </div>
      )}
    </div>
  );
}
