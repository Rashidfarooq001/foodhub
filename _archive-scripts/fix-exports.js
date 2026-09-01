const fs = require('fs');
const path = require('path');

function getExports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const exports = [];
  const lines = content.split('\n');
  for (const line of lines) {
    let match = line.match(
      /export\s+(const|let|var|function|class|interface|type)\s+([a-zA-Z0-9_]+)/,
    );
    if (match) {
      exports.push(match[2]);
    }
    match = line.match(/export\s+async\s+function\s+([a-zA-Z0-9_]+)/);
    if (match) {
      exports.push(match[1]);
    }
    match = line.match(/export\s+\{\s*([^}]+)\s*\}/);
    if (match && !line.includes(' from ')) {
      exports.push(...match[1].split(',').map((s) => s.trim().split(' as ')[0]));
    }
  }
  return exports.filter((e) => e && e !== 'default');
}

const file = process.argv[2];
let content = fs.readFileSync(file, 'utf8');
let newContent = '';
const dir = path.dirname(file);
const lines = content.split('\n');
for (const line of lines) {
  const match = line.match(/export\s+\*\s+from\s+['"]\.\/([^'"]+)\.js['"]/);
  if (match) {
    const depName = match[1];
    let depPath = path.join(dir, depName + '.ts');
    if (!fs.existsSync(depPath)) {
      depPath = path.join(dir, depName, 'index.ts');
    }
    if (!fs.existsSync(depPath)) {
      depPath = path.join(dir, depName + '.tsx');
    }
    if (fs.existsSync(depPath)) {
      const exports = getExports(depPath);
      if (exports.length > 0) {
        newContent += `export { ${Array.from(new Set(exports)).join(', ')} } from './${depName}.js';\n`;
      } else {
        newContent += line + '\n';
      }
    } else {
      newContent += line + '\n';
    }
  } else {
    newContent += line + '\n';
  }
}
fs.writeFileSync(file, newContent, 'utf8');
