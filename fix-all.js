const fs = require('fs');
const glob = require('glob');
const path = require('path');

// Fix index.ts files
const indexFiles = glob.sync('packages/*/src/**/*.ts');
for (const file of indexFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(".js'") || content.includes('.js"')) {
    content = content.replace(/\.js(['"])/g, "$1");
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated imports in", file);
  }
}

// Fix tsconfig files
const tsconfigs = glob.sync('packages/*/tsconfig.json');
for (const file of tsconfigs) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  if (content.includes('"moduleResolution": "NodeNext"')) {
    content = content.replace(/"moduleResolution":\s*"NodeNext"/g, '"moduleResolution": "bundler"');
    changed = true;
  }
  if (content.includes('"module": "NodeNext"')) {
    content = content.replace(/"module":\s*"NodeNext"/g, '"module": "esnext"');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated tsconfig in", file);
  }
}
