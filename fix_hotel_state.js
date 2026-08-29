const fs = require('fs');
let code = fs.readFileSync('apps/hotel-dashboard/src/app/page.tsx', 'utf8');

// Add setGstRate
if (!code.includes('const [gstRate, setGstRate]')) {
  code = code.replace(
    "const [stats, setStats] = useState",
    "const [gstRate, setGstRate] = useState(5);\n  const [stats, setStats] = useState"
  );
  fs.writeFileSync('apps/hotel-dashboard/src/app/page.tsx', code, 'utf8');
  console.log('Fixed gstRate state declaration');
} else {
  console.log('gstRate already declared');
}
