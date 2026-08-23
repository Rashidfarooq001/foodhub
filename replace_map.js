const fs = require('fs');
let c = fs.readFileSync('apps/customer-web/src/components/map/GoogleMapPicker.tsx', 'utf8');

c = c.replace(/import React, \{ useState, useCallback, useRef \} from 'react';/, "import React, { useState, useCallback, useRef, useEffect } from 'react';");

const useEffectLogic = \
  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      setMarkerPos({ lat: initialLat, lng: initialLng });
      if (mapRef.current) {
        mapRef.current.panTo({ lat: initialLat, lng: initialLng });
      }
    }
  }, [initialLat, initialLng]);

  const onMapLoad\;

c = c.replace(/  const onMapLoad/, useEffectLogic);

fs.writeFileSync('apps/customer-web/src/components/map/GoogleMapPicker.tsx', c);
