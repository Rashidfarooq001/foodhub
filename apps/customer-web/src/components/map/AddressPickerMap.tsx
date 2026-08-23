import React from 'react';
import { GoogleMapPicker } from './GoogleMapPicker';

interface AddressPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export const AddressPickerMap: React.FC<AddressPickerMapProps> = ({
  initialLat,
  initialLng,
  onLocationChange,
}) => {
  return (
    <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden relative z-0">
      <GoogleMapPicker
        initialLat={initialLat}
        initialLng={initialLng}
        onLocationChange={onLocationChange}
        className="w-full h-full"
      />
    </div>
  );
};
