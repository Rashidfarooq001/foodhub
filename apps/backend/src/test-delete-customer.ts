import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { PrismaService } from './modules/database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const prisma = app.get(PrismaService);
  
  // 1. Create User & Customer
  const user = await prisma.user.create({
    data: {
      phone: '+919999999988',
      email: 'test-del2@example.com',
      passwordHash: 'hash',
      role: 'CUSTOMER',
      profile: { create: { firstName: 'Test', lastName: 'Delete' } },
      customer: { create: {} }
    },
    include: { customer: true }
  });
  
  console.log('Created User ID:', user.id);
  
  // 2. Delete Customer
  try {
    await usersService.permanentlyDeleteCustomer(user.id);
    console.log('Deleted successfully via permanentlyDeleteCustomer');
  } catch (e) {
    console.error('Failed to delete:', e.message);
  }
  
  // 3. Check if User exists
  const found = await prisma.user.findFirst({ where: { phone: '+919999999988' } });
  console.log('User found after delete?', !!found);
  
  await app.close();
}
bootstrap();
