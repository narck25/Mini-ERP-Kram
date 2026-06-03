const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // Buscar al usuario
  const user = await prisma.user.findUnique({
    where: { email: 'alopez.umb@gmail.com' }
  });
  
  if (user) {
    console.log('=== USUARIO ENCONTRADO ===');
    console.log('ID:', user.id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('isActive:', user.isActive);
    console.log('Password hash (first 30 chars):', user.password.substring(0, 30) + '...');
    
    // Probar si la contraseña "test123" funciona
    const testPasswords = ['test123', 'Admin123!', 'password123'];
    for (const pwd of testPasswords) {
      const valid = await bcrypt.compare(pwd, user.password);
      console.log(`Password "${pwd}": ${valid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    }
  } else {
    console.log('❌ Usuario NO encontrado con email: alopez.umb@gmail.com');
    
    // Buscar todos los usuarios para ver qué emails existen
    const allUsers = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
    console.log('\n=== TODOS LOS USUARIOS ===');
    allUsers.forEach(u => console.log(`- ${u.id}: ${u.email} (${u.name})`));
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
