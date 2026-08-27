const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', 'utf8');

code = `import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation2, Check, AlertTriangle } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAddressStore } from '../../stores/use-address-store';
import { CustomerAddressItem } from '../../stores/use-address-store';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: { label: string; address: string; lat: number; lng: number; locationSource: string }) => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const { status, coordinates, addressData, error, requestLocation } = useGeolocation();
  
  const [manualAddress, setManualAddress] = useState('');

  // 1. Current GPS Location Handler
  useEffect(() => {
    if (status === 'granted' && coordinates && addressData) {
      const specificName = addressData.locality || addressData.subDistrict || addressData.district || 'Current Location';
      
      const gpsAddr: CustomerAddressItem = {
        id: 'current-gps',
        label: 'Current Location',
        placeName: specificName,
        addressLine1: addressData.formattedAddress || specificName,
        city: addressData.district || '',
        state: addressData.state || '',
        postalCode: addressData.postalCode || '',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationSource: 'CURRENT_GPS',
        verificationStatus: 'VERIFIED',
        isDefault: false,
      };

      useAddressStore.getState().addAddress(gpsAddr);
      useAddressStore.getState().setSelectedAddress('current-gps');

      onSelectLocation({
        label: 'Current Location',
        address: specificName,
        lat: coordinates.latitude,
        lng: coordinates.longitude,
        locationSource: 'CURRENT_GPS',
      });
    }
  }, [status, coordinates, addressData, onSelectLocation]);

  const handleUseCurrentLocation = async () => {
    await requestLocation();
  };

  // 2. Manual Address Handler (Pure Text, NO MAPPLS)
  const handleConfirmManualAddress = () => {
    if (!manualAddress.trim()) return;
    
    const addrId = 'manual-' + Date.now();
    const manualAddr = {
      id: addrId,
      label: 'Manual Address',
      placeName: 'Manual Address',
      addressLine1: manualAddress.trim(),
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      latitude: undefined as any,
      longitude: undefined as any,
      locationSource: 'MANUAL_ADDRESS' as const,
      verificationStatus: 'UNVERIFIED' as const,
      isDefault: false,
    };

    useAddressStore.getState().addAddress(manualAddr);
    useAddressStore.getState().setSelectedAddress(addrId);

    onSelectLocation({
      label: 'Manual Address',
      address: manualAddress.trim(),
      lat: 0, // Fallback for the callback
      lng: 0, // Fallback for the callback
      locationSource: 'MANUAL_ADDRESS',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-lg font-black text-gray-900">Delivery Location</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* OPTION 1: CURRENT GPS */}
          <div>
            <button
              onClick={handleUseCurrentLocation}
              disabled={status === 'requesting'}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-left transition hover:bg-orange-50 hover:border-orange-100 group disabled:opacity-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-orange-600 group-hover:scale-110 transition-transform">
                <Navigation2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Use Current Location</h3>
                <p className="text-xs text-gray-500 font-medium">Use device GPS</p>
              </div>
            </button>
            {error && (
              <p className="mt-2 text-xs font-bold text-red-500 px-2">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {/* OPTION 2: MANUAL ADDRESS */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Enter your complete delivery address
            </label>
            <textarea
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="e.g. House No 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir - 193201"
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white p-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-all shadow-sm box-border"
            />
            <button
              onClick={handleConfirmManualAddress}
              disabled={!manualAddress.trim()}
              className="w-full rounded-xl bg-orange-600 py-3.5 text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
            >
              Save Location
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', code);
