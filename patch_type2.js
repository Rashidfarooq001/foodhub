const fs = require('fs');
const hookPath = 'apps/customer-web/src/hooks/useGeolocation.ts';
let content = fs.readFileSync(hookPath, 'utf8');

content = content.replace(
  /import \{\n  BrowserLocationService,\n  GeoLocationResult,\n  ReverseGeocodeResult,\n\} from '\.\.\/services\/browser-location';/,
  "import { BrowserLocationService } from '../services/browser-location';\nimport type { GeoLocationResult, ReverseGeocodeResult } from '../services/browser-location';"
);

fs.writeFileSync(hookPath, content, 'utf8');
