const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 'admin-123', role: 'SUPER_ADMIN' }, 'super-secret-jwt-key-foodhub-2026-enterprise', { expiresIn: '1h' });
console.log(token);
