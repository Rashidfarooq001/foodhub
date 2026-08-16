const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:\\Users\\RASHID FAROOQ\\.gemini\\antigravity\\scratch\\foodhub';
const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo']);

const SECRET_PATTERNS = [
  /postgresql:\/\/[^'"\s]+/gi,
  /postgres:\/\/[^'"\s]+/gi,
  /ep-[a-z0-9-]+\.[a-z0-9-.]+\.neon\.tech/gi,
  /foodhub_db_owner:[^@\s"']+/gi,
];

function scanDirectory(dir, findings = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, findings);
    } else if (entry.isFile()) {
      // Don't scan binary/image files
      if (/\.(png|jpg|jpeg|ico|svg|woff|woff2|ttf|eot|pdf)$/i.test(entry.name)) continue;

      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of SECRET_PATTERNS) {
          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(content)) !== null) {
            findings.push({
              file: path.relative(ROOT_DIR, fullPath),
              match: match[0],
            });
          }
        }
      } catch (err) {
        // Skip unreadable files
      }
    }
  }
  return findings;
}

console.log('=== SCANNING ENTIRE MONOREPO FOR HARDCODED SECRETS ===\n');
const findings = scanDirectory(ROOT_DIR);

if (findings.length === 0) {
  console.log('✅ ZERO hardcoded database connection strings found!');
} else {
  console.log(`⚠️ FOUND ${findings.length} HARDCODED SECRET REFERENCES:\n`);
  findings.forEach((f) => console.log(`  - [${f.file}]: ${f.match.substring(0, 40)}...`));
}
