'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
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
    let map: any;
    let marker: any;

    async function initMap() {
      const L = (await import('leaflet')).default;

      if (!document.getElementById('leaflet-css')) {
        const link  = document.createElement('link');
        link.id     = 'leaflet-css';
        link.rel    = 'stylesheet';
        link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapElRef.current) return;

      const defaultLat = initialLat && initialLat !== 0 ? initialLat : 34.3868;
      const defaultLng = initialLng && initialLng !== 0 ? initialLng : 74.5221;

      map = L.map(mapElRef.current, { zoomControl: true }).setView([defaultLat, defaultLng], 16);
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

      marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Update position on move/drag
      const updateLocation = async (lat: number, lng: number) => {
        setMarkerLat(lat);
        setMarkerLng(lng);
        try {
          const res = await fetch(`${API_BASE}/geolocation/reverse-geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          const address = typeof data === 'string' ? data : (data.address || data.displayName || 'Selected Location');
          setSelectedAddr(address);
          onAddressSelected({ lat, lng, displayName: address });
        } catch {
          onAddressSelected({ lat, lng, displayName: 'Selected Location' });
        }
      };

      // Initial reverse geocode
      updateLocation(defaultLat, defaultLng);

      map.on('moveend', () => {
        const center = map.getCenter();
        if (markerRef.current) {
          markerRef.current.setLatLng(center);
        }
        updateLocation(center.lat, center.lng);
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        updateLocation(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        updateLocation(lat, lng);
      });
    }

    initMap();
    return () => { map?.remove(); };
  }, []);

  return (
    <div className="relative flex flex-col gap-3">
      {/* Helper Banner */}
      <div className="flex items-center justify-between rounded-xl bg-orange-50 px-3.5 py-2 text-xs text-orange-900 border border-orange-100">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-600 shrink-0" />
          <span className="font-semibold text-gray-800">Move map to place pin at exact delivery point</span>
        </div>
      </div>

      {/* Map Container with Center Pin Overlay */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0">
        <div ref={mapElRef} className="h-72 w-full" />
        {/* Fixed Center Pin Overlay */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center pb-8">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-orange-600 p-2.5 text-white shadow-xl ring-4 ring-orange-500/30">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="h-2 w-2 rounded-full bg-black/40 blur-[1px] mt-0.5" />
          </div>
        </div>
      </div>

      {/* Selected Location Card */}
      <div className="rounded-2xl bg-orange-50/60 border border-orange-100 p-3.5 space-y-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-gray-900">
          <MapPin className="h-4 w-4 text-orange-600 shrink-0" />
          <span>Selected Location:</span>
        </div>
        <p className="text-gray-800 font-bold text-xs leading-snug">
          {selectedAddr || 'Detecting location area...'}
        </p>
        {markerLat !== 0 && markerLng !== 0 && (
          <p className="text-[10px] text-orange-700 font-mono pt-0.5">
            Coordinates: {markerLat.toFixed(5)}, {markerLng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}
