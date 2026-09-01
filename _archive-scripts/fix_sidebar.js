const fs = require('fs');
let code = fs.readFileSync('apps/admin-dashboard/src/components/layout/AdminSidebar.tsx', 'utf8');

code = code.replace(
  "{ name: 'Pricing & Unit Economics', href: '/pricing-config', icon: DollarSign },",
  '',
);
code = code.replace(
  "{ name: 'System Settings', href: '/system-settings', icon: Settings },",
  "{ name: 'Settings', href: '/settings', icon: Settings },",
);
code = code.replace(
  "{ name: 'Account Settings', href: '/settings', icon: UserCog },",
  "{ name: 'Account Settings', href: '/account-settings', icon: UserCog },",
);

fs.writeFileSync('apps/admin-dashboard/src/components/layout/AdminSidebar.tsx', code);
console.log('Modified AdminSidebar.tsx');
