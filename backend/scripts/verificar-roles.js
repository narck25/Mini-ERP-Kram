const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 VERIFICANDO ROLES Y USUARIOS ACTUALES');
    console.log('=========================================\n');
    
    // Verificar roles existentes
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Roles existentes: ${roles.length}`);
    console.log('📋 Lista de roles:');
    roles.forEach(role => {
      console.log(`   • ${role.name} (ID: ${role.id})`);
      console.log(`     Descripción: ${role.description || 'Sin descripción'}`);
      console.log(`     Permisos: ${JSON.stringify(role.permissions)}`);
    });
    
    // Verificar usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n👥 Usuarios existentes: ${users.length}`);
    console.log('📋 Lista de usuarios:');
    users.forEach(user => {
      console.log(`   • ${user.name} (${user.email})`);
      console.log(`     Rol: ${user.role}, Activo: ${user.isActive}`);
    });
    
    // Verificar distribución de roles
    console.log('\n📈 DISTRIBUCIÓN DE ROLES:');
    const roleDistribution = {};
    users.forEach(user => {
      if (!roleDistribution[user.role]) {
        roleDistribution[user.role] = 0;
      }
      roleDistribution[user.role]++;
    });
    
    Object.entries(roleDistribution).forEach(([role, count]) => {
      console.log(`   • ${role}: ${count} usuario(s)`);
    });
    
    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error fatal:', e);
    await prisma.$disconnect();
    process.exit(1);
  });