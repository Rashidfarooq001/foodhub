const fs=require('fs'); 
let c=fs.readFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', 'utf8'); 

c = c.replace(/import \{ MapPin[\s\S]*?lucide-react';/, (match) => match + '\nimport { useGeolocation } from \'../../hooks/useGeolocation\';'); 

c = c.replace(/  const handleUseCurrentLocation = \(\) => \{[\s\S]*?maximumAge: 60000,\r?\n      \}\r?\n    \);\r?\n  \};/, 
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
        address: address.formattedAddress || coords.latitude.toFixed(4) + ', ' + coords.longitude.toFixed(4),
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
); 

c = c.replace(/\{errorMessage && \(/g, '{(errorMessage || hookError) && (').replace(/<span>\{errorMessage\}<\/span>/g, '<span>{errorMessage || hookError}</span>'); 
fs.writeFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', c);
