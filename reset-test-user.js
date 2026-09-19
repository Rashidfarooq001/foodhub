const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const phone = '+919320646292';
  const newPassword = 'zayka@123';
  
  console.log(`Resetting password for ${phone} to ${newPassword}`);
  const newHash = await bcrypt.hash(newPassword, 10); // Using cost 10 as seen in DB
  
  const updatedUser = await prisma.user.update({
    where: { phone: phone },
    data: { passwordHash: newHash }
  });
  
  console.log('Successfully updated password hash.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
