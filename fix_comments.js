const fs = require('fs');
let code = fs.readFileSync('apps/admin-dashboard/src/components/layout/AdminHeader.tsx', 'utf8');

// Remove the word 'Search' from the comment
code = code.replace(/\{\/\* Left: Mobile Hamburger & Desktop Search \*\/\}/, "{/* Left: Mobile Hamburger */}");
code = code.replace(/\{\/\* Right Controls - Horizontally scrollable \*\/\}/, "{/* Right Controls */}"); // just in case

fs.writeFileSync('apps/admin-dashboard/src/components/layout/AdminHeader.tsx', code);
