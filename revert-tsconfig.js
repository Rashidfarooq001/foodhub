const fs = require('fs');
const glob = require('glob');
const path = require('path');

// Fix tsconfig files
const tsconfigs = glob.sync('packages/*/tsconfig.json');
for (const file of tsconfigs) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  if (content.includes('"moduleResolution": "bundler"')) {
    content = content.replace(/"moduleResolution":\s*"bundler"/g, '"moduleResolution": "NodeNext"');
    changed = true;
  }
  if (content.includes('"module": "esnext"')) {
    content = content.replace(/"module":\s*"esnext"/g, '"module": "NodeNext"');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log("Reverted tsconfig in", file);
  }
}
