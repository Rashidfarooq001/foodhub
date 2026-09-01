const fs = require('fs');

const packages = ['ui', 'utils', 'types', 'config', 'api-client', 'hooks'];
for (const pkg of packages) {
  const path = `packages/${pkg}/package.json`;
  if (fs.existsSync(path)) {
    const json = JSON.parse(fs.readFileSync(path, 'utf8'));
    json.type = 'module';
    fs.writeFileSync(path, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Updated ${path}`);
  }
}
