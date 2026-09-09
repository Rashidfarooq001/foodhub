const fs = require('fs');
const file = 'apps/backend/src/app.module.ts';
let code = fs.readFileSync(file, 'utf8');

// Remove imports
code = code.replace(/import \{ ThrottlerGuard, ThrottlerModule \} from '@nestjs\/throttler';\n/, '');

// Remove ThrottlerModule from imports array
code = code.replace(/\s*ThrottlerModule\.forRoot\(\[\{ ttl: 60000, limit: 1000 \}\]\),/, '');

// Remove APP_GUARD provider for ThrottlerGuard
const providerRegex = /\s*\{\s*provide: APP_GUARD,\s*useClass: ThrottlerGuard,\s*\},/;
code = code.replace(providerRegex, '');

// Also remove APP_GUARD import if not used elsewhere (it's imported from @nestjs/core)
// Let's just leave APP_GUARD import, it won't hurt, or remove it if we want to be clean.
code = code.replace(/import \{ APP_GUARD \} from '@nestjs\/core';\n/, '');

fs.writeFileSync(file, code);
