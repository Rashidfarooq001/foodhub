const fs = require('fs');

const apps = ['customer-web', 'admin-dashboard', 'hotel-dashboard', 'delivery-dashboard'];

apps.forEach(app => {
  const file = `apps/${app}/next.config.ts`;
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/swcMinify: true,\s*/g, '');
    fs.writeFileSync(file, content);
  }
});
