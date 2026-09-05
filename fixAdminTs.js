const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix import
  content = content.replace(
    /import { useAuthStore } from '\.\.\/\.\.\/stores\/use-auth-store';/,
    "import { useAdminAuthStore } from '../../stores/use-admin-auth-store';"
  );
  
  content = content.replace(
    /const { accessToken } = useAuthStore\(\);/,
    "const { accessToken } = useAdminAuthStore();"
  );

  // Fix adminFetch returns (add .json())
  content = content.replace(
    /const data = await adminFetch\((.*?)\);\s+set/g,
    "const res = await adminFetch($1);\n      const data = await res.json();\n      set"
  );

  fs.writeFileSync(file, content);
}

patchFile('apps/admin-dashboard/src/app/cms/page.tsx');
patchFile('apps/admin-dashboard/src/app/coupons/page.tsx');
console.log('Fixed admin typescript errors');
