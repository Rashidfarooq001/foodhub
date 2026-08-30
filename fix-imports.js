const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            content = content.replace(/from '(\.[^']+)'/g, (match, p1) => {
                if (p1.endsWith('.js')) return match;
                return `from '${p1}.js'`;
            });
            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

processDir('packages/ui/src');
processDir('packages/utils/src');
processDir('packages/hooks/src');
processDir('packages/api-client/src');
