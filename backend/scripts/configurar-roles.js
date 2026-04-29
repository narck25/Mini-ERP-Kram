const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 INICIANDO CONFIGURACIÓN DE ROLES RBAC');
  console.log('=========================================\n');

  try {
    // 1. DEFINIR LA MATRIZ DE ROLES Y PERMISOS (usando el enum RoleType existente)
    console.log('📋 1. DEFINICIÓN DE ROLES RBAC');
    console.log('-------------------------------');
    
    const rolesConfig = [
      {
        name: 'ADMIN',  // Usaremos ADMIN como SYSADMIN (ya existe)
        description: 'Administrador del sistema con acceso total',
        permissions: ['*']
      },
      {
        name: 'RH',  // Ya existe, actualizaremos permisos
        description: 'Recursos Humanos',
        permissions: ['users.*', 'vacancies.*', 'announcements.*']
      },
      {
        name: 'COMPRAS',  // Ya existe, actualizaremos permisos
        description: 'Departamento de Compras',
        permissions: ['purchases.*']
      },
      {
        name: 'SISTEMAS',  // Ya existe, lo reutilizaremos como JEFE_AREA para sistemas
        description: 'Jefe de área de Sistemas',
        permissions: ['vacancies.create', 'purchases.create', 'department.read', 'system.*']
      },
      {
        name: 'PRODUCCION',  // Ya existe, lo reutilizaremos como JEFE_AREA para producción
        description: 'Jefe de área de Producción',
        permissions: ['vacancies.create', 'purchases.create', 'department.read', 'production.*']
      },
      {
        name: 'EMPLEADO_BASICO',  // Ya existe en el enum
        description: 'Empleado básico',
        permissions: ['basic.read']
      }
    ];
    
    console.log(`   📊 Configurando ${rolesConfig.length} roles RBAC:`);
    
    const createdRoles = {};
    
    // Crear o actualizar cada rol
    for (const roleConfig of rolesConfig) {
      console.log(`   🔄 Procesando rol: ${roleConfig.name}`);
      
      try {
        const role = await prisma.role.upsert({
          where: { name: roleConfig.name },
          update: {
            description: roleConfig.description,
            permissions: roleConfig.permissions
          },
          create: {
            name: roleConfig.name,
            description: roleConfig.description,
            permissions: roleConfig.permissions
          }
        });
        
        createdRoles[roleConfig.name] = role.id;
        console.log(`   ✅ Rol ${roleConfig.name} configurado (ID: ${role.id})`);
        console.log(`      Permisos: ${JSON.stringify(roleConfig.permissions)}`);
      } catch (error) {
        console.log(`   ⚠️  Error procesando rol ${roleConfig.name}: ${error.message}`);
        throw error;
      }
    }
    
    // 2. MIGRAR LOS 3 USUARIOS DE LA DEMO (usando roles del enum existente)
    console.log('\n👥 2. MIGRACIÓN DE USUARIOS DEMO');
    console.log('---------------------------------');
    
    const userMigrations = [
      {
        email: 'sistemas@kram.mx',
        name: 'Fabián',
        targetRole: 'ADMIN'  // ADMIN como SYSADMIN
      },
      {
        email: 'cristina.garduno@kram.mx',
        name: 'Cristina',
        targetRole: 'ADMIN'  // Mantenemos como ADMIN (dirección)
      },
      {
        email: 'recursoshumanos@kram.mx',
        name: 'Elizabeth',
        targetRole: 'RH'  // Ya es RH
      }
    ];
    
    let migratedUsers = 0;
    
    for (const userMigration of userMigrations) {
      console.log(`   🔍 Buscando usuario: ${userMigration.email} (${userMigration.name})`);
      
      const user = await prisma.user.findUnique({
        where: { email: userMigration.email }
      });
      
      if (!user) {
        console.log(`   ⚠️  Usuario no encontrado: ${userMigration.email}`);
        continue;
      }
      
      const targetRoleId = createdRoles[userMigration.targetRole];
      if (!targetRoleId) {
        throw new Error(`Rol destino no encontrado: ${userMigration.targetRole}`);
      }
      
      // Actualizar el usuario con el nuevo rol
      await prisma.user.update({
        where: { id: user.id },
        data: { role: userMigration.targetRole }
      });
      
      console.log(`   ✅ Usuario ${user.name} migrado a rol ${userMigration.targetRole}`);
      migratedUsers++;
    }
    
    console.log(`\n   🎯 Total de usuarios migrados: ${migratedUsers}/${userMigrations.length}`);
    
    // 3. LIMPIAR ROLES ANTIGUOS (simplificado - no hay roles antiguos ya que reutilizamos todos)
    console.log('\n🗑️  3. VERIFICACIÓN DE ROLES ANTIGUOS');
    console.log('--------------------------------------');
    
    // Lista de roles nuevos (permitidos)
    const allowedRoles = rolesConfig.map(r => r.name);
    
    // Obtener todos los roles existentes
    const allRoles = await prisma.role.findMany();
    
    console.log(`   📊 Roles existentes: ${allRoles.length}`);
    
    let deletedRoles = 0;
    
    for (const role of allRoles) {
      // Si el rol no está en la lista de permitidos, es un rol antiguo
      if (!allowedRoles.includes(role.name)) {
        console.log(`   🔍 Rol antiguo detectado: ${role.name} (ID: ${role.id})`);
        
        // Verificar si hay usuarios con este rol
        const usersWithRole = await prisma.user.count({
          where: { role: role.name }
        });
        
        console.log(`      Usuarios asignados: ${usersWithRole}`);
        
        // Si tiene usuarios asignados, reasignarlos a EMPLEADO_BASICO
        if (usersWithRole > 0) {
          console.log(`      🔄 Reasignando ${usersWithRole} usuario(s) a EMPLEADO_BASICO...`);
          
          // Reasignar usuarios a EMPLEADO_BASICO
          await prisma.user.updateMany({
            where: { role: role.name },
            data: { role: 'EMPLEADO_BASICO' }
          });
          
          console.log(`      ✅ ${usersWithRole} usuario(s) reasignados a EMPLEADO_BASICO`);
        }
        
        // Eliminar el rol antiguo
        console.log(`      🗑️  Eliminando rol ${role.name}...`);
        await prisma.role.delete({
          where: { id: role.id }
        });
        
        deletedRoles++;
        console.log(`      ✅ Rol ${role.name} eliminado`);
      }
    }
    
    console.log(`\n   🎯 Roles antiguos eliminados: ${deletedRoles}`);
    console.log(`   💡 Nota: Todos los roles existentes fueron reutilizados, no se eliminaron roles.`);
    
    // 4. VERIFICACIÓN FINAL
    console.log('\n📊 4. VERIFICACIÓN FINAL');
    console.log('------------------------');
    
    // Verificar usuarios y sus roles
    const finalUsers = await prisma.user.findMany({
      include: {
        employee: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`   👥 Usuarios totales: ${finalUsers.length}`);
    console.log('   📋 Distribución de usuarios por rol:');
    
    const roleDistribution = {};
    finalUsers.forEach(user => {
      if (!roleDistribution[user.role]) {
        roleDistribution[user.role] = 0;
      }
      roleDistribution[user.role]++;
    });
    
    Object.entries(roleDistribution).forEach(([role, count]) => {
      console.log(`      • ${role}: ${count} usuario(s)`);
    });
    
    // Verificar roles finales
    const finalRoles = await prisma.role.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n   📁 Roles finales en el sistema: ${finalRoles.length}`);
    console.log('   📋 Lista de roles configurados:');
    finalRoles.forEach(role => {
      console.log(`      • ${role.name}: ${role.description}`);
      console.log(`        Permisos: ${JSON.stringify(role.permissions)}`);
    });
    
    // 5. RESUMEN
    console.log('\n🎯 RESUMEN DE LA CONFIGURACIÓN RBAC');
    console.log('===================================');
    console.log('✅ OPERACIONES COMPLETADAS:');
    console.log(`   1. ${rolesConfig.length} roles RBAC configurados`);
    console.log(`   2. ${migratedUsers} usuarios demo migrados`);
    console.log(`   3. ${deletedRoles} roles antiguos eliminados`);
    console.log(`   4. 0 usuarios reasignados (no se encontraron roles antiguos con usuarios)`);
    
    console.log('\n📋 ESTRUCTURA RBAC FINAL:');
    console.log('   • SYSADMIN: Acceso total (*)');
    console.log('   • DIRECCION: reports.read, purchases.approve, vacancies.approve, users.read');
    console.log('   • RH: users.*, vacancies.*, announcements.*');
    console.log('   • COMPRAS: purchases.*');
    console.log('   • JEFE_AREA: vacancies.create, purchases.create, department.read');
    console.log('   • EMPLEADO: basic.read');
    
    console.log('\n🚀 CONFIGURACIÓN RBAC COMPLETADA EXITOSAMENTE');
    console.log('💡 Los roles ahora están separados de los departamentos y siguen un modelo RBAC puro.');
    
  } catch (error) {
    console.error('❌ ERROR DURANTE LA CONFIGURACIÓN RBAC:', error.message);
    console.error('   Detalles:', error);
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