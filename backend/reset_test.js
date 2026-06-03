const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const NEW_PASSWORD = 'MiNuevaPass123!';
  
  // Hashear la nueva contraseña
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
  console.log('Nuevo hash:', hashedPassword);
  
  // Actualizar en BD
  await prisma.user.update({
    where: { email: 'alopez.umb@gmail.com' },
    data: { password: hashedPassword }
  });
  
  console.log('✅ Contraseña actualizada en BD');
  
  // Verificar que funciona
  const user = await prisma.user.findUnique({
    where: { email: 'alopez.umb@gmail.com' }
  });
  
  const valid = await bcrypt.compare(NEW_PASSWORD, user.password);
  console.log(`Verificación con bcrypt.compare: ${valid ? '✅ OK' : '❌ FALLÓ'}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
