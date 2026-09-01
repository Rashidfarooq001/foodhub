const fs = require('fs');
const file = 'apps/customer-web/src/components/tracking/LiveTrackingMap.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the marker logic
content = content.replace(
  /const dMarker = new window\.mappls\.Marker\(\{\s+map,\s+position: \{ lat: driverLat, lng: driverLng \},\s+popupHtml: `.*?`,\s+\}\);/g,
  `const dMarker = new window.mappls.Marker({
          map,
          position: { lat: driverLat, lng: driverLng },
          icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
          width: 40,
          height: 40,
          popupHtml: \`<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#047857;padding:2px 4px;">?? \${driverName || 'Delivery Partner'} (Live)</div>\`,
        });`,
);

// Same for the other location where it updates marker OR creates a new one
content = content.replace(
  /const dMarker = new window\.mappls\.Marker\(\{\s+map: mapInstanceRef\.current,\s+position: \{ lat: driverLat, lng: driverLng \},\s+popupHtml: `.*?`,\s+\}\);/g,
  `const dMarker = new window.mappls.Marker({
          map: mapInstanceRef.current,
          position: { lat: driverLat, lng: driverLng },
          icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
          width: 40,
          height: 40,
          popupHtml: \`<div style="font-family:sans-serif;font-weight:bold;font-size:12px;color:#047857;padding:2px 4px;">?? \${driverName || 'Delivery Partner'} (Live)</div>\`,
        });`,
);

// Expose a recenter method to the parent via an id or custom event, but wait!
// It's easier if we expose a ref using forwardRef, but the component is not using forwardRef.
// Let's add a global event listener inside the useEffect!

const globalEventListenerCode = `
  // Global listener for "recenter-rider" event
  useEffect(() => {
    const handleRecenter = () => {
      const map = mapInstanceRef.current;
      if (!map || mapState !== 'READY') return;
      
      const bounds = [];
      if (hasValidCoords(driverLat, driverLng)) bounds.push([Number(driverLat), Number(driverLng)]);
      if (hasValidCoords(customerLat, customerLng)) bounds.push([Number(customerLat), Number(customerLng)]);
      if (routeCoordinates && routeCoordinates.length >= 2) {
        routeCoordinates.forEach(coord => {
          if (Array.isArray(coord)) {
            bounds.push([Number(coord[0]), Number(coord[1])]);
          } else if (coord && typeof coord === 'object') {
            bounds.push([Number(coord.lat), Number(coord.lng)]);
          }
        });
      }
      
      if (bounds.length > 0) {
        const minLat = Math.min(...bounds.map(b => b[0]));
        const maxLat = Math.max(...bounds.map(b => b[0]));
        const minLng = Math.min(...bounds.map(b => b[1]));
        const maxLng = Math.max(...bounds.map(b => b[1]));
        try {
          map.fitBounds([
            [minLat - 0.005, minLng - 0.005],
            [maxLat + 0.005, maxLng + 0.005]
          ]);
        } catch {}
      }
    };
    
    window.addEventListener('recenter-rider', handleRecenter);
    return () => window.removeEventListener('recenter-rider', handleRecenter);
  }, [mapState, driverLat, driverLng, customerLat, customerLng, routeCoordinates]);
`;

content = content.replace(
  '// Handle container resize',
  globalEventListenerCode + '\n  // Handle container resize',
);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched LiveTrackingMap.tsx');
