const fs = require('fs');

function extractExports(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const exports = [];

  // match export const, export function, export interface, export type, export class
  const regex = /export\s+(?:const|function|interface|type|class)\s+([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  // match export { A, B }
  const regex2 = /export\s+\{([^}]+)\}/g;
  while ((match = regex2.exec(content)) !== null) {
    const names = match[1]
      .split(',')
      .map((n) => n.trim().split(/\s+/)[0])
      .filter((n) => n && n !== 'type');
    exports.push(...names);
  }

  return [...new Set(exports)];
}

function processPackage(pkgDir) {
  const indexPath = `${pkgDir}/src/index.ts`;
  if (!fs.existsSync(indexPath)) return;

  let content = fs.readFileSync(indexPath, 'utf8');
  const lines = content.split('\n');
  const newLines = [];

  for (const line of lines) {
    const match = line.match(/export\s+\*\s+from\s+['"]\.\/([^'"]+)(?:\.js)?['"]/);
    if (match) {
      let relativePath = match[1];
      if (relativePath.endsWith('.js')) relativePath = relativePath.slice(0, -3);
      if (relativePath.endsWith('.ts')) relativePath = relativePath.slice(0, -3);

      const targetPath = `${pkgDir}/src/${relativePath}.ts`;
      const exports = extractExports(targetPath);
      if (exports.length > 0) {
        newLines.push(`export { ${exports.join(', ')} } from './${relativePath}.js';`);
      } else {
        newLines.push(`// No exports found in ${relativePath}`);
      }
    } else {
      newLines.push(line);
    }
  }

  fs.writeFileSync(indexPath, newLines.join('\n'), 'utf8');
  console.log(`Patched ${indexPath}`);
}

processPackage('packages/ui');
processPackage('packages/utils');
processPackage('packages/types');
processPackage('packages/config');
processPackage('packages/api-client');
