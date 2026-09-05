import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAddressStore } from '../../stores/use-address-store';
import type { CustomerAddressItem } from '../../stores/use-address-store';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocality?: string;
  currentAddress?: string;
  onSelectLocation: (loc: {
    label: string;
    address: string;
    lat: number;
    lng: number;
    locationSource: string;
  }) => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const { status, coordinates, addressData, error, requestLocation } = useGeolocation();

  const [manualAddress, setManualAddress] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  // Use a ref to ensure the GPS-success effect only fires ONCE per GPS grant.
  // Without this, any re-render that creates new onSelectLocation/onClose refs
  // would retrigger this effect causing an infinite loop → crash.
  const gpsHandledRef = useRef(false);

  // Reset the guard whenever the modal opens so GPS can fire again on next open
  useEffect(() => {
    if (isOpen) {
      gpsHandledRef.current = false;
    }
  }, [isOpen]);

  // 1. Current GPS Location Handler — fires ONCE when status becomes 'granted'
  useEffect(() => {
    if (status !== 'granted' || !coordinates || !addressData) return;
    if (gpsHandledRef.current) return; // Already handled — prevent re-run
    gpsHandledRef.current = true;

    const specificName =
      addressData.locality ||
      (addressData as any).subDistrict ||
      addressData.district ||
      'Current Location';

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

    // Update address store via static getState() to avoid re-render dependency
    useAddressStore.getState().addAddress(gpsAddr);
    useAddressStore.getState().setSelectedAddress('current-gps');

    // Call parent callbacks via refs to avoid them being in the dep array
    onSelectLocation({
      label: 'Current Location',
      address: specificName,
      lat: coordinates.latitude,
      lng: coordinates.longitude,
      locationSource: 'CURRENT_GPS',
    });

    onClose(); // Auto-close on success
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, coordinates, addressData]); // onSelectLocation + onClose intentionally excluded —
  // they are inline arrow functions in the parent (new ref every render).
  // The gpsHandledRef guard ensures this runs only once per GPS result.

  const handleUseCurrentLocation = async () => {
    gpsHandledRef.current = false; // Allow re-run if user clicks again after a failure
    await requestLocation();
  };

  // 2. Manual Address Handler (Resolves via backend)
  const handleConfirmManualAddress = async () => {
    if (!manualAddress.trim()) return;

    setIsResolving(true);
    setResolveError('');

    try {
      const res = await fetch('/api/geo/search?q=' + encodeURIComponent(manualAddress.trim()));
      let data: any = null;

      if (res.ok) {
        data = await res.json();
      }

      // Fallback: try the location resolve endpoint
      if (!data || !data.latitude) {
        const API_BASE = (await import('@foodhub/config')).getApiBaseUrl();
        const res2 = await fetch(`${API_BASE}/location/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: manualAddress.trim() }),
        });
        data = res2.ok ? await res2.json() : null;
      }

      if (data && data.success && data.latitude && data.longitude) {
        const addrId = 'manual-' + Date.now();
        const manualAddr: CustomerAddressItem = {
          id: addrId,
          label: 'Manual Address',
          placeName: data.formattedAddress || 'Manual Address',
          addressLine1: manualAddress.trim(),
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          latitude: data.latitude,
          longitude: data.longitude,
          locationSource: 'MANUAL_GEOCODED',
          verificationStatus: 'VERIFIED',
          isDefault: false,
        };

        useAddressStore.getState().addAddress(manualAddr);
        useAddressStore.getState().setSelectedAddress(addrId);

        onSelectLocation({
          label: 'Manual Address',
          address: data.formattedAddress || manualAddress.trim(),
          lat: data.latitude,
          lng: data.longitude,
          locationSource: 'MANUAL_GEOCODED',
        });

        onClose();
      } else {
        setResolveError(
          data?.message || "Couldn't verify this location. Please enter a more specific address.",
        );
      }
    } catch (err) {
      setResolveError('Network error while verifying location. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4 pb-3">
          <h2 className="text-base font-bold text-gray-900">Delivery Location</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 pt-3 space-y-4">
          {/* OPTION 1: CURRENT GPS */}
          <div>
            <button
              onClick={handleUseCurrentLocation}
              disabled={status === 'requesting'}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 h-[68px] text-left transition hover:bg-orange-50 hover:border-orange-100 group disabled:opacity-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-orange-600 group-hover:scale-110 transition-transform">
                <MapPin className={`h-[18px] w-[18px] ${status === 'requesting' ? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-sm text-gray-900 truncate">
                  {status === 'requesting' ? 'Detecting your location...' : 'Use Current Location'}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium truncate">
                  {status === 'denied' ? 'Permission denied — enable in browser settings' : 'Use device GPS'}
                </p>
              </div>
            </button>
            {error && <p className="mt-1.5 text-[11px] font-bold text-red-500 px-1">{error}</p>}
          </div>

          <div className="flex items-center gap-2 px-2">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              OR
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {/* OPTION 2: MANUAL ADDRESS */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider px-1">
              Delivery Address
            </label>
            <textarea
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Enter your location/address..."
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-all shadow-sm box-border h-[80px]"
            />
            <button
              onClick={handleConfirmManualAddress}
              disabled={!manualAddress.trim() || isResolving}
              className="w-full flex items-center justify-center rounded-xl bg-orange-600 h-[52px] text-sm font-bold text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
            >
              {isResolving ? 'Verifying location...' : 'Save Location'}
            </button>
            {resolveError && (
              <p className="mt-1.5 text-[11px] font-bold text-red-500 text-center leading-tight">
                {resolveError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
