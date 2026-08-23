'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Search, X, Check, Building, Home, Briefcase, AlertCircle, Loader2 } from 'lucide-react';
import { useGeolocation } from "../../hooks/useGeolocation";
import { getApiBaseUrl } from '@foodhub/config';
import { GooglePlacesAutocomplete } from '../map/GooglePlacesAutocomplete';
import { useAddressStore } from '../../stores/use-address-store';

const API_BASE = getApiBaseUrl();

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocality: string;
  currentAddress: string;
  onSelectLocation: (location: {
    label: string;
    address: string;
    lat: number;
    lng: number;
    locality?: string;
    district?: string;
  }) => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLocality,
  currentAddress,
  onSelectLocation,
}) => {
  const { addresses, setSelectedAddress } = useAddressStore();
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'success' | 'denied' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; district: string; lat: number; lng: number; formattedAddress?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  // 1. Native Device GPS Detection & Backend Resolution
  const { status: hookStatus, error: hookError, requestLocation } = useGeolocation();
  const handleUseCurrentLocation = async () => {
    setGpsStatus('detecting');
    setErrorMessage('');
    const res = await requestLocation();
    if (res) {
      const { coords, address } = res;
      setGpsStatus('success');
      onSelectLocation({
        label: address.locality || (address.formattedAddress ? address.formattedAddress.split(',')[0] : 'Current Location'),
        address: address.formattedAddress || (coords.latitude.toFixed(4) + ', ' + coords.longitude.toFixed(4)),
        lat: coords.latitude,
        lng: coords.longitude,
        locality: address.locality,
        district: address.district,
      });
      setTimeout(onClose, 400);
    } else {
      setGpsStatus('error');
    }
  };

  // 2. Search locality / place name via backend
  const handleSearchPlaces = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/geolocation/search-place?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.places || []);
      }
    } catch {
      // Backend search failed
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-rose-600" />
            <h2 className="text-base font-black text-gray-900">Select Delivery Location</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Current GPS Trigger Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsStatus === 'detecting'}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-rose-100 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/20 group-hover:scale-105 transition">
                {gpsStatus === 'detecting' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Navigation className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-black text-rose-900">
                  {gpsStatus === 'detecting' ? 'Detecting Real GPS Location...' : 'Use Current Location'}
                </p>
                <p className="text-[11px] text-rose-700 font-medium">
                  {gpsStatus === 'detecting' ? 'Requesting device coordinates' : 'Using device GPS & Kashmir Location Resolver'}
                </p>
              </div>
            </div>
            {gpsStatus === 'success' && <Check className="h-5 w-5 text-emerald-600" />}
          </button>

          {/* GPS Error / Denied Feedback */}
          {(errorMessage || hookError) && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorMessage || hookError}</span>
            </div>
          )}

          {/* Locality / Area Search Bar (Google Places API) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">Search Locality / Village</label>
            <GooglePlacesAutocomplete
              onSelectPlace={(place) => {
                onSelectLocation({
                  label: place.locality || 'Searched Location',
                  address: place.address,
                  lat: place.lat,
                  lng: place.lng,
                  locality: place.locality,
                  district: place.district,
                });
                onClose();
              }}
              placeholder="Search Kehnusa, Aloosa, Sopore, Bandipora..."
            />
          </div>

          {/* Saved Addresses Section (If user has saved addresses) */}
          {addresses.length > 0 && (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Saved Addresses</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {addresses.map((addr) => {
                  const isWork = addr.label?.toUpperCase().includes('WORK');
                  const isHome = addr.label?.toUpperCase().includes('HOME');
                  const Icon = isWork ? Briefcase : isHome ? Home : Building;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddress(addr.id);
                        onSelectLocation({
                          label: addr.label || 'Saved Address',
                          address: [addr.addressLine1, addr.city, addr.postalCode].filter(Boolean).join(', '),
                          lat: addr.latitude || 0,
                          lng: addr.longitude || 0,
                        });
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 transition text-left"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {addr.label || 'Address'}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {[addr.addressLine1, addr.city].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
