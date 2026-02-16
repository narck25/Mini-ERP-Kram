const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create roles
  console.log('Creating roles...');
  const roles = [
    { name: 'ADMIN', description: 'Administrador del sistema' },
    { name: 'RH', description: 'Recursos Humanos' },
    { name: 'SISTEMAS', description: 'Departamento de Sistemas' },
    { name: 'COMPRAS', description: 'Departamento de Compras' }
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: {
        ...roleData,
        permissions: JSON.stringify(['read', 'write', 'delete'])
      }
    });
  }
  console.log('✅ Roles created');

  // Create admin user
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@kram.com' },
    update: {},
    create: {
      email: 'admin@kram.com',
      password: hashedPassword,
      name: 'Administrador KRAM',
      role: 'ADMIN',
      isActive: true
    }
  });
  console.log('✅ Admin user created');

  // Create sample users for each role
  console.log('Creating sample users...');
  const sampleUsers = [
    { email: 'rh@kram.com', name: 'Juan Pérez RH', role: 'RH', password: 'rh123' },
    { email: 'sistemas@kram.com', name: 'María García Sistemas', role: 'SISTEMAS', password: 'sistemas123' },
    { email: 'compras@kram.com', name: 'Carlos López Compras', role: 'COMPRAS', password: 'compras123' }
  ];

  for (const userData of sampleUsers) {
    const hashedPass = await bcrypt.hash(userData.password, 10);
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: hashedPass,
        name: userData.name,
        role: userData.role,
        isActive: true
      }
    });
  }
  console.log('✅ Sample users created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });