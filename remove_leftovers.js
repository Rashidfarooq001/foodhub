const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

const regex = /\/\/ MODE 2 — Place-Name Location Search Handler[\s\S]*?setIsSearchingPlace\(false\);\r?\n\s*\};\r?\n\r?\n\s*const handleSelectPlaceCandidate[\s\S]*?setShowCustomAddressModal\(false\);\r?\n\s*setPlaceSearchInput\(''\);\r?\n\s*setPlaceCandidates\(\[\]\);\r?\n\s*\};/g;

code = code.replace(regex, '');

fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
