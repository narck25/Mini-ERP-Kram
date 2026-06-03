const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // 1. Ver el hash actual
  const user = await prisma.user.findUnique({
    where: { email: 'alopez.umb@gmail.com' }
  });
  console.log('Hash actual en BD:', user.password);
  
  // 2. Probar bcrypt.compare directamente
  const testPass = 'MiNuevaPass123!';
  const result1 = await bcrypt.compare(testPass, user.password);
  console.log(`bcrypt.compare("${testPass}", hash): ${result1}`);
  
  // 3. Hacer un hash nuevo y comparar
  const newHash = await bcrypt.hash(testPass, 10);
  console.log('Nuevo hash generado:', newHash);
  const result2 = await bcrypt.compare(testPass, newHash);
  console.log(`bcrypt.compare con nuevo hash: ${result2}`);
  
  // 4. Guardar el nuevo hash y probar de nuevo
  await prisma.user.update({
    where: { email: 'alopez.umb@gmail.com' },
    data: { password: newHash }
  });
  console.log('Hash actualizado en BD');
  
  // 5. Verificar
  const user2 = await prisma.user.findUnique({
    where: { email: 'alopez.umb@gmail.com' }
  });
  const result3 = await bcrypt.compare(testPass, user2.password);
  console.log(`Verificación final: ${result3}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
