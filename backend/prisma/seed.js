// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const roles = ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'ADMIN'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Create admin user
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const passwordHash = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@bank.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@bank.com',
      passwordHash,
      roleId: adminRole.id,
    },
  });

  // Create manager user
  const managerRole = await prisma.role.findUnique({ where: { name: 'MANAGER' } });
  const managerHash = await bcrypt.hash('manager123', 12);

  await prisma.user.upsert({
    where: { email: 'manager@bank.com' },
    update: {},
    create: {
      name: 'Branch Manager',
      email: 'manager@bank.com',
      passwordHash: managerHash,
      roleId: managerRole.id,
    },
  });

  console.log('Seed data created successfully');
  console.log('Admin: admin@bank.com / admin123');
  console.log('Manager: manager@bank.com / manager123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
