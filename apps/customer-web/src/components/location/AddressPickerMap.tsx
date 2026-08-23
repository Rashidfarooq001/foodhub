import React from 'react';
import { GoogleMapPicker } from '../map/GoogleMapPicker';

interface Props {
  initialLat?: number;
  initialLng?: number;
  onSelectLocation: (lat: number, lng: number) => void;
}

export const AddressPickerMap: React.FC<Props> = ({
  initialLat,
  initialLng,
  onSelectLocation,
}) => {
  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-200">
      <GoogleMapPicker
        initialLat={initialLat}
        initialLng={initialLng}
        onLocationChange={onSelectLocation}
      />
    </div>
  );
};
