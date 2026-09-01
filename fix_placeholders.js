const fs = require('fs');
const glob = require('glob');

const replacements = [
  { match: /placeholder="7006298759 or email"/g, replace: 'placeholder="Phone number or email"' },
  { match: /placeholder="7006298759"/g, replace: 'placeholder="Enter phone number"' },
  { match: /placeholder="9876543211"/g, replace: 'placeholder="Enter phone number"' },
  { match: /placeholder="driver@zaykafood\.com"/g, replace: 'placeholder="Enter email"' },
  { match: /placeholder="driver@example\.com"/g, replace: 'placeholder="Enter email"' },
  { match: /placeholder="you@example\.com"/g, replace: 'placeholder="Enter email"' },
  { match: /placeholder="ananya@example\.com"/g, replace: 'placeholder="Enter email"' },
  { match: /placeholder="aadil@example\.com"/g, replace: 'placeholder="Enter email"' },
  { match: /placeholder="owner@restaurant\.com"/g, replace: 'placeholder="Enter email"' },
  { match: /placeholder="98765432101"/g, replace: 'placeholder="Enter ID number"' },
  { match: /placeholder="918273645019"/g, replace: 'placeholder="Enter ID number"' }
];

const files = glob.sync('apps/**/*.tsx', { ignore: '**/node_modules/**' });
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(r => {
    content = content.replace(r.match, r.replace);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated:', file);
    changedFiles++;
  }
});
console.log('Total files updated:', changedFiles);
