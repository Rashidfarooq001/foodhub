import io
import re

# 1. LocationSelectorModal.tsx
with io.open('apps/customer-web/src/components/home/LocationSelectorModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add import
text = text.replace(
    "import { MapPin, Search, Navigation, Building, Briefcase, Home, Check, Loader2, X, AlertCircle } from 'lucide-react';",
    "import { MapPin, Search, Navigation, Building, Briefcase, Home, Check, Loader2, X, AlertCircle } from 'lucide-react';\nimport { useGeolocation } from '../../hooks/useGeolocation';"
)

# Replace handleUseCurrentLocation
match = re.search(r'  const handleUseCurrentLocation = \(\) => \{[\s\S]*?maximumAge: 60000,\n      \}\n    \);\n  \};', text)
if match:
    new_logic = '''  const { status: hookStatus, error: hookError, requestLocation } = useGeolocation();
  const handleUseCurrentLocation = async () => {
    setGpsStatus('detecting');
    setErrorMessage('');
    
    const res = await requestLocation();
    if (res) {
      const { coords, address } = res;
      setGpsStatus('success');
      onSelectLocation({
        label: address.locality || address.formattedAddress?.split(',')[0] || 'Current Location',
        address: address.formattedAddress || ${coords.latitude.toFixed(4)}, ,
        lat: coords.latitude,
        lng: coords.longitude,
        locality: address.locality,
        district: address.district,
      });
      setTimeout(onClose, 400);
    } else {
      setGpsStatus('error');
    }
  };'''
    text = text[:match.start()] + new_logic + text[match.end():]
    
    # Also fix the errorMessage logic to use hookError if available
    text = text.replace(
        '''{errorMessage && (''',
        '''{(errorMessage || hookError) && ('''
    ).replace(
        '''<span>{errorMessage}</span>''',
        '''<span>{errorMessage || hookError}</span>'''
    )

with io.open('apps/customer-web/src/components/home/LocationSelectorModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

