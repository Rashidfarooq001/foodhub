const bcrypt = require('bcrypt');
async function findOtp(hash) {
  for (let i = 1000; i < 10000; i++) {
    const isMatch = await bcrypt.compare(i.toString(), hash);
    if (isMatch) return i;
  }
  return null;
}
findOtp('$2b$10$x9bKgquoJkMBjh4Zr.0zFuP9onEubmH0jjOhjfISaZIiP87946Upa').then(console.log);
