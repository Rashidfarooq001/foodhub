const jwt = require('jsonwebtoken');

// We need to generate a JWT for this driver to test the endpoint.
const userId = 'db9ce56f-17ad-4811-b956-2b0ea0a938b8';
const role = 'DELIVERY_PARTNER';
const JWT_SECRET = process.env.JWT_SECRET || 'ZAYKAFOOD_SUPER_SECRET_FALLBACK_JWT_KEY_2026';

const token = jwt.sign({ sub: userId, id: userId, role: role }, JWT_SECRET, { expiresIn: '1h' });
console.log('TOKEN:', token);
