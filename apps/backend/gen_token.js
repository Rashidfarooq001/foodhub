const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: '11111111-1111-1111-1111-111111111111', role: 'CUSTOMER' },
  'super-secret-jwt-key-foodhub-2026-enterprise',
  { expiresIn: '1h' },
);
console.log(token);
