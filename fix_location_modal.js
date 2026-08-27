const fs = require('fs');

const code = `'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { useGeolocation } from "../../hooks/useGeolocation";
import { getApiBaseUrl } from '@foodhub/config';
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
    locationSource?: 'CURRENT_GPS' | 'MAPPLS_GEOCODE';
  }) => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [manualAddress, setManualAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [matchedLocation, setMatchedLocation] = useState<any>(null);

  const { requestLocation } = useGeolocation();

  if (!isOpen) return null;

  // 1. Current GPS Flow
  const handleUseCurrentLocation = async () => {
    setGpsStatus('detecting');
    setVerificationError('');
    const res = await requestLocation();
    if (res) {
      const { coords, address } = res;
      setGpsStatus('success');
      
      const locality = address.locality || address.village || address.subLocality || 'Current Location';
      const district = address.district || address.city || '';
      const state = address.state || 'Jammu & Kashmir';
      const pincode = address.pincode || address.postalCode || '';
      const cleanAddress = address.formattedAddress || [locality, district, state].filter(Boolean).join(', ') + (pincode ? \` - \${pincode}\` : '');

      const gpsAddr = {
        id: 'current-location',
        label: 'Current Location',
        placeName: locality,
        addressLine1: locality,
        city: district,
        state: state,
        postalCode: pincode,
        latitude: coords.latitude,
        longitude: coords.longitude,
        locationSource: 'CURRENT_GPS' as const,
        verificationStatus: 'VERIFIED' as const,
        isDefault: false,
      };
      
      useAddressStore.getState().addAddress(gpsAddr);
      useAddressStore.getState().setSelectedAddress('current-location');

      onSelectLocation({
        label: 'Current Location',
        address: cleanAddress,
        lat: coords.latitude,
        lng: coords.longitude,
        locality,
        district,
        locationSource: 'CURRENT_GPS',
      });
      setTimeout(() => {
        setGpsStatus('idle');
        onClose();
      }, 300);
    } else {
      setGpsStatus('error');
    }
  };

  // 2. Manual Address Flow
  const handleVerifyAddress = async () => {
    if (!manualAddress.trim()) return;
    setIsVerifying(true);
    setVerificationError('');
    setMatchedLocation(null);

    try {
      const res = await fetch(\`\${API_BASE}/geolocation/forward-geocode\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: manualAddress.trim() }),
      });
      const data = await res.json();

      if (data.success && data.latitude && data.longitude) {
        setMatchedLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          formattedAddress: data.formattedAddress || manualAddress.trim(),
        });
      } else {
        setVerificationError("Couldn't find this address. Please enter a more specific address.");
      }
    } catch (err) {
      setVerificationError("Unable to verify this address right now. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmManualAddress = () => {
    if (!matchedLocation) return;
    
    // Create an ID for store tracking
    const addrId = 'manual-' + Date.now();
    const manualAddr = {
      id: addrId,
      label: 'Manual Address',
      placeName: 'Manual Address',
      addressLine1: manualAddress.trim(), // Keep user's typed string as line 1
      addressLine2: matchedLocation.formattedAddress,
      city: '',
      state: '',
      postalCode: '',
      latitude: matchedLocation.latitude,
      longitude: matchedLocation.longitude,
      locationSource: 'MAPPLS_GEOCODE' as const,
      verificationStatus: 'VERIFIED' as const,
      isDefault: false,
    };

    useAddressStore.getState().addAddress(manualAddr);
    useAddressStore.getState().setSelectedAddress(addrId);

    onSelectLocation({
      label: 'Manual Address',
      address: matchedLocation.formattedAddress,
      lat: matchedLocation.latitude,
      lng: matchedLocation.longitude,
      locationSource: 'MAPPLS_GEOCODE',
    });
    
    // Reset state and close
    setManualAddress('');
    setMatchedLocation(null);
    onClose();
  };

  const handleResetManual = () => {
    setMatchedLocation(null);
    setVerificationError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-lg font-black text-gray-900">Delivery Address</h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto">
          
          {/* Section: GPS */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={gpsStatus === 'detecting'}
            className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left hover:bg-rose-100 transition disabled:opacity-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              {gpsStatus === 'detecting' ? (
                <Loader2 className="h-5 w-5 text-rose-600 animate-spin" />
              ) : (
                <Navigation className="h-5 w-5 text-rose-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-black text-rose-700">Use Current Location</p>
              <p className="text-xs font-bold text-rose-600/70">Using your device GPS</p>
            </div>
          </button>
          
          {gpsStatus === 'error' && (
             <p className="text-xs font-bold text-rose-600 mt-2 ml-1 flex items-center gap-1">
               <AlertCircle className="w-3.5 h-3.5" /> Please allow location permissions in your browser.
             </p>
          )}

          <div className="flex items-center my-5">
            <div className="h-px flex-1 bg-gray-100"></div>
            <span className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-100"></div>
          </div>

          {/* Section: Manual Address */}
          {!matchedLocation ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Enter Complete Address
              </label>
              <textarea
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="House 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir 193201"
                rows={4}
                disabled={isVerifying}
                className="w-full rounded-2xl border border-gray-200 p-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-50 resize-none disabled:opacity-50"
              />
              
              {verificationError && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-100">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{verificationError}</p>
                </div>
              )}

              <button
                onClick={handleVerifyAddress}
                disabled={!manualAddress.trim() || isVerifying}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
              >
                {isVerifying ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Checking address...</>
                ) : (
                  'Save Location'
                )}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              
              <div className="flex items-center gap-2 text-emerald-800">
                <Check className="h-5 w-5 bg-emerald-100 rounded-full p-1 text-emerald-600" />
                <h3 className="font-black">Address matched</h3>
              </div>
              
              <div className="text-xs font-bold text-emerald-900/70 bg-emerald-100/50 p-3 rounded-xl">
                ? Mappls verified location
              </div>
              
              <div className="text-sm font-bold text-gray-900 leading-relaxed bg-white p-4 rounded-xl border border-emerald-100">
                {matchedLocation.formattedAddress}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleResetManual}
                  className="flex-1 rounded-xl bg-white border border-gray-200 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Change Address
                </button>
                <button
                  onClick={handleConfirmManualAddress}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white hover:bg-emerald-700 shadow-sm transition"
                >
                  Use This Location
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', code);
