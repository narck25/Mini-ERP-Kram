const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const allUsers = await prisma.user.findMany({ 
    select: { id: true, email: true, name: true, role: true, isActive: true, password: true } 
  });
  
  console.log('=== TODOS LOS USUARIOS ===');
  for (const u of allUsers) {
    console.log(`- ${u.id}: ${u.email} (${u.name}) [${u.role}] active:${u.isActive}`);
    console.log(`  Hash: ${u.password.substring(0, 30)}...`);
    
    // Probar contraseñas comunes
    const tests = ['Admin123!', 'password123', 'admin123', 'Admin123'];
    for (const pwd of tests) {
      const valid = await bcrypt.compare(pwd, u.password);
      if (valid) console.log(`  ✅ "${pwd}" funciona!`);
    }
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
