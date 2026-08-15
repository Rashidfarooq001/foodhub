const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\RASHID FAROOQ\\.gemini\\antigravity\\scratch\\foodhub';
const TARGET_DIRS = [
  'apps/backend',
  'apps/customer-web',
  'apps/hotel-dashboard',
  'apps/delivery-dashboard',
  'apps/admin-dashboard',
  'packages/api-client',
  'packages/types',
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.prisma')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const auditKeywords = [
  'TODO',
  'FIXME',
  'MOCK_',
  'dummy',
  'hardcoded',
  'DEV_',
];

console.log('=== SYSTEM-WIDE CODEBASE FORENSIC AUDIT ===\n');

const findings = [];

TARGET_DIRS.forEach((relDir) => {
  const fullDir = path.join(ROOT, relDir);
  const files = getAllFiles(fullDir);

  files.forEach((filePath) => {
    const relFile = path.relative(ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      auditKeywords.forEach((kw) => {
        if (line.includes(kw) && !filePath.includes('mock-data') && !filePath.includes('test') && !line.includes('// Keep interface')) {
          findings.push({ file: relFile, line: idx + 1, keyword: kw, text: line.trim() });
        }
      });
    });
  });
});

console.log(`Total Audit Findings across source files: ${findings.length}\n`);
findings.slice(0, 50).forEach((f) => {
  console.log(`[${f.keyword}] ${f.file}:${f.line} -> ${f.text}`);
});
