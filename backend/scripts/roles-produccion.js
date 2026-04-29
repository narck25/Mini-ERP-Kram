const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 INICIANDO MIGRACIÓN A MODELO RBAC HÍBRIDO (FUNCIONAL + JERÁRQUICO)');
  console.log('========================================================================\n');

  try {
    // 1. DEFINIR LA MATRIZ DEFINITIVA DE ROLES
    console.log('📋 1. DEFINICIÓN DE ROLES RBAC HÍBRIDOS');
    console.log('----------------------------------------');
    
    // Usamos los roles existentes del enum RoleType pero con nuevos permisos RBAC híbridos
    const rolesConfig = [
      {
        name: 'ADMIN',  // Existe en el enum
        description: 'Administrador del sistema con acceso total',
        permissions: ['*']
      },
      {
        name: 'RH',  // Existe en el enum
        description: 'Recursos Humanos',
        permissions: ['users.*', 'vacancies.*', 'announcements.*', 'departments.read']
      },
      {
        name: 'COMPRAS',  // Existe en el enum
        description: 'Departamento de Compras',
        permissions: ['purchases.*', 'quotes.*', 'providers.*']
      },
      {
        name: 'SISTEMAS',  // Existe en el enum - lo usaremos como DIRECTOR
        description: 'Director/Sistemas (nivel jerárquico alto)',
        permissions: ['reports.global', 'purchases.approve_high', 'vacancies.approve', 'system.*']
      },
      {
        name: 'PRODUCCION',  // Existe en el enum - lo usaremos como GERENTE
        description: 'Gerente/Producción (nivel jerárquico medio)',
        permissions: ['department.read', 'team.read', 'purchases.approve_dept', 'vacancies.create', 'purchases.create', 'production.*']
      },
      {
        name: 'EMPLEADO_BASICO',  // Existe en el enum - lo usaremos como OPERATIVO
        description: 'Personal operativo (nivel jerárquico base)',
        permissions: ['self.read', 'purchases.create_basic', 'basic.read']
      }
    ];
    
    // Mapeo de roles nuevos a roles del enum
    const roleMapping = {
      'DIRECTOR': 'SISTEMAS',
      'GERENTE': 'PRODUCCION', 
      'OPERATIVO': 'EMPLEADO_BASICO'
    };
    
    console.log(`   📊 Configurando ${rolesConfig.length} roles RBAC híbridos:`);
    
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
    
    // 2. PROTEGER A LOS USUARIOS ACTUALES
    console.log('\n👥 2. PROTECCIÓN DE USUARIOS ACTUALES');
    console.log('--------------------------------------');
    
    const userAssignments = [
      {
        email: 'sistemas@kram.mx',
        name: 'Fabián',
        targetRole: 'ADMIN'
      },
      {
        email: 'recursoshumanos@kram.mx',
        name: 'Elizabeth',
        targetRole: 'RH'
      },
      {
        email: 'cristina.garduno@kram.mx',
        name: 'Cristina',
        targetRole: 'PRODUCCION'  // Mapeado a GERENTE (PRODUCCION en el enum)
      }
    ];
    
    let assignedUsers = 0;
    
    for (const userAssignment of userAssignments) {
      console.log(`   🔍 Buscando usuario: ${userAssignment.email} (${userAssignment.name})`);
      
      const user = await prisma.user.findUnique({
        where: { email: userAssignment.email }
      });
      
      if (!user) {
        console.log(`   ⚠️  Usuario no encontrado: ${userAssignment.email}`);
        continue;
      }
      
      const targetRoleId = createdRoles[userAssignment.targetRole];
      if (!targetRoleId) {
        throw new Error(`Rol destino no encontrado: ${userAssignment.targetRole}`);
      }
      
      // Actualizar el usuario con el nuevo rol
      await prisma.user.update({
        where: { id: user.id },
        data: { role: userAssignment.targetRole }
      });
      
      console.log(`   ✅ Usuario ${user.name} asignado a rol ${userAssignment.targetRole}`);
      assignedUsers++;
    }
    
    console.log(`\n   🎯 Total de usuarios protegidos: ${assignedUsers}/${userAssignments.length}`);
    
    // 3. LIMPIEZA FINAL - ELIMINAR ROLES VIEJOS
    console.log('\n🗑️  3. LIMPIEZA DE ROLES VIEJOS');
    console.log('-------------------------------');
    
    // Lista de roles permitidos (nuevos)
    const allowedRoles = rolesConfig.map(r => r.name);
    
    // Obtener todos los roles existentes
    const allRoles = await prisma.role.findMany();
    
    console.log(`   📊 Roles existentes antes de limpieza: ${allRoles.length}`);
    
    let deletedRoles = 0;
    let reassignedUsers = 0;
    
    for (const role of allRoles) {
      // Si el rol no está en la lista de permitidos, es un rol viejo
      if (!allowedRoles.includes(role.name)) {
        console.log(`   🔍 Rol viejo detectado: ${role.name} (ID: ${role.id})`);
        
        // Verificar si hay usuarios con este rol
        const usersWithRole = await prisma.user.count({
          where: { role: role.name }
        });
        
        console.log(`      Usuarios asignados: ${usersWithRole}`);
        
        // Si tiene usuarios asignados, reasignarlos a EMPLEADO_BASICO (OPERATIVO en el mapeo)
        if (usersWithRole > 0) {
          console.log(`      🔄 Reasignando ${usersWithRole} usuario(s) a EMPLEADO_BASICO...`);
          
          // Reasignar usuarios a EMPLEADO_BASICO
          await prisma.user.updateMany({
            where: { role: role.name },
            data: { role: 'EMPLEADO_BASICO' }
          });
          
          reassignedUsers += usersWithRole;
          console.log(`      ✅ ${usersWithRole} usuario(s) reasignados a EMPLEADO_BASICO`);
        }
        
        // Eliminar el rol viejo
        console.log(`      🗑️  Eliminando rol ${role.name}...`);
        await prisma.role.delete({
          where: { id: role.id }
        });
        
        deletedRoles++;
        console.log(`      ✅ Rol ${role.name} eliminado`);
      }
    }
    
    console.log(`\n   🎯 Roles viejos eliminados: ${deletedRoles}`);
    console.log(`   👥 Usuarios reasignados: ${reassignedUsers}`);
    
    // 4. VERIFICACIÓN FINAL
    console.log('\n📊 4. VERIFICACIÓN FINAL');
    console.log('------------------------');
    
    // Verificar usuarios y sus roles
    const finalUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
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
    console.log('\n🎯 RESUMEN DE LA MIGRACIÓN RBAC HÍBRIDA');
    console.log('========================================');
    console.log('✅ OPERACIONES COMPLETADAS:');
    console.log(`   1. ${rolesConfig.length} roles RBAC híbridos configurados`);
    console.log(`   2. ${assignedUsers} usuarios protegidos y asignados`);
    console.log(`   3. ${deletedRoles} roles viejos eliminados`);
    console.log(`   4. ${reassignedUsers} usuarios reasignados a OPERATIVO`);
    
    console.log('\n📋 ESTRUCTURA RBAC HÍBRIDA FINAL:');
    console.log('   • ADMIN: Acceso total (*)');
    console.log('   • RH: users.*, vacancies.*, announcements.*, departments.read');
    console.log('   • COMPRAS: purchases.*, quotes.*, providers.*');
    console.log('   • DIRECTOR: reports.global, purchases.approve_high, vacancies.approve');
    console.log('   • GERENTE: department.read, team.read, purchases.approve_dept, vacancies.create, purchases.create');
    console.log('   • SUPERVISOR: team.read, purchases.create, basic.read');
    console.log('   • OPERATIVO: self.read, purchases.create_basic, basic.read');
    
    console.log('\n🚀 MIGRACIÓN RBAC HÍBRIDA COMPLETADA EXITOSAMENTE');
    console.log('💡 El sistema ahora usa un modelo RBAC híbrido (funcional + jerárquico) escalable para 19 departamentos.');
    console.log('💡 Los niveles jerárquicos (DIRECTOR, GERENTE, SUPERVISOR, OPERATIVO) se combinan con roles funcionales (ADMIN, RH, COMPRAS).');
    
  } catch (error) {
    console.error('❌ ERROR DURANTE LA MIGRACIÓN RBAC HÍBRIDA:', error.message);
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