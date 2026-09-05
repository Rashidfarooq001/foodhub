const fs = require('fs');

const apps = ['customer-web', 'admin-dashboard', 'hotel-dashboard', 'delivery-dashboard'];

apps.forEach(app => {
  const file = `apps/${app}/next.config.ts`;
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('experimental:')) {
      content = content.replace(
        'reactStrictMode: true,',
        `reactStrictMode: true,
  swcMinify: true,
  compress: true,
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: ['lucide-react', 'date-fns', 'lodash'],
  },`
      );
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
});
