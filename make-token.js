const jwt = require('jsonwebtoken');
const token = jwt.sign({ sub: 'admin-id', role: 'SUPER_ADMIN' }, 'super-secret-jwt-key-foodhub-2026-enterprise');
console.log(token);
