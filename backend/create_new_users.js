const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creando usuarios solicitados...\n');

  try {
    // 1. Función para obtener módulos por rol
    const getModulesForUser = (role, requestedModules) => {
      // Siempre incluir DASHBOARD
      const modules = ['DASHBOARD'];
      
      // Agregar módulos solicitados si son válidos
      const validModules = [
        'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 
        'INCIDENCIAS', 'CONFIGURACION', 'REPORTES', 'COMPRAS'
      ];
      
      requestedModules.forEach(module => {
        if (validModules.includes(module) && !modules.includes(module)) {
          modules.push(module);
        }
      });
      
      return modules;
    };

    // 2. Crear usuario 1: Elizabeth Zurita Luna (RH)
    console.log('1. Creando usuario: Elizabeth Zurita Luna (RH)');
    
    const rhModules = getModulesForUser('RH', [
      'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 
      'INCIDENCIAS', 'REPORTES', 'COMPRAS'
    ]);

    // Verificar si el usuario ya existe
    const existingRhUser = await prisma.user.findUnique({
      where: { email: 'recursoshumanos@kram.mx' }
    });

    if (existingRhUser) {
      console.log('   ⚠️  Usuario ya existe, actualizando...');
      await prisma.user.update({
        where: { email: 'recursoshumanos@kram.mx' },
        data: {
          name: 'Elizabeth Zurita Luna',
          password: await bcrypt.hash('123456', 10),
          role: 'RH',
          accessibleModules: rhModules,
          isActive: true
        }
      });
      console.log('   ✅ Usuario actualizado');
    } else {
      const rhUser = await prisma.user.create({
        data: {
          email: 'recursoshumanos@kram.mx',
          password: await bcrypt.hash('123456', 10),
          name: 'Elizabeth Zurita Luna',
          role: 'RH',
          accessibleModules: rhModules,
          isActive: true
        }
      });
      console.log('   ✅ Usuario creado');
      console.log(`   ID: ${rhUser.id}`);
    }

    // 3. Crear usuario 2: PRUEBAS HUB Reclutamiento (PRODUCCION)
    console.log('\n2. Creando usuario: PRUEBAS HUB Reclutamiento (PRODUCCION)');
    
    const hubRModules = getModulesForUser('PRODUCCION', [
      'RECLUTAMIENTO', 'COMPRAS'
    ]);

    // Verificar si el usuario ya existe
    const existingHubRUser = await prisma.user.findUnique({
      where: { email: 'hub.r@kram.mx' }
    });

    if (existingHubRUser) {
      console.log('   ⚠️  Usuario ya existe, actualizando...');
      await prisma.user.update({
        where: { email: 'hub.r@kram.mx' },
        data: {
          name: 'PRUEBAS HUB Reclutamiento',
          password: await bcrypt.hash('123456', 10),
          role: 'PRODUCCION',
          accessibleModules: hubRModules,
          isActive: true
        }
      });
      console.log('   ✅ Usuario actualizado');
    } else {
      const hubRUser = await prisma.user.create({
        data: {
          email: 'hub.r@kram.mx',
          password: await bcrypt.hash('123456', 10),
          name: 'PRUEBAS HUB Reclutamiento',
          role: 'PRODUCCION',
          accessibleModules: hubRModules,
          isActive: true
        }
      });
      console.log('   ✅ Usuario creado');
      console.log(`   ID: ${hubRUser.id}`);
    }

    // 4. Crear usuario 3: PRUEBAS HUB Compras (SISTEMAS)
    console.log('\n3. Creando usuario: PRUEBAS HUB Compras (SISTEMAS)');
    
    const hubCModules = getModulesForUser('SISTEMAS', [
      'RECLUTAMIENTO', 'COMPRAS'
    ]);

    // Verificar si el usuario ya existe
    const existingHubCUser = await prisma.user.findUnique({
      where: { email: 'hub.c@kram.mx' }
    });

    if (existingHubCUser) {
      console.log('   ⚠️  Usuario ya existe, actualizando...');
      await prisma.user.update({
        where: { email: 'hub.c@kram.mx' },
        data: {
          name: 'PRUEBAS HUB Compras',
          password: await bcrypt.hash('123456', 10),
          role: 'SISTEMAS',
          accessibleModules: hubCModules,
          isActive: true
        }
      });
      console.log('   ✅ Usuario actualizado');
    } else {
      const hubCUser = await prisma.user.create({
        data: {
          email: 'hub.c@kram.mx',
          password: await bcrypt.hash('123456', 10),
          name: 'PRUEBAS HUB Compras',
          role: 'SISTEMAS',
          accessibleModules: hubCModules,
          isActive: true
        }
      });
      console.log('   ✅ Usuario creado');
      console.log(`   ID: ${hubCUser.id}`);
    }

    // 5. Modificar usuario existente: compras@kram.com
    console.log('\n4. Modificando usuario: compras@kram.com');
    
    // Verificar si el usuario existe
    const existingComprasUser = await prisma.user.findUnique({
      where: { email: 'compras@kram.com' }
    });

    if (existingComprasUser) {
      console.log('   ✅ Usuario encontrado, actualizando nombre...');
      await prisma.user.update({
        where: { email: 'compras@kram.com' },
        data: {
          name: 'Jose Luis Gonzalez',
          // Mantener la contraseña existente
          // Mantener el rol existente (COMPRAS)
          // Mantener módulos accesibles existentes
        }
      });
      console.log('   ✅ Nombre actualizado a "Jose Luis Gonzalez"');
    } else {
      console.log('   ⚠️  Usuario compras@kram.com no encontrado');
      console.log('   ℹ️  Creando nuevo usuario compras@kram.com');
      
      const comprasModules = getModulesForUser('COMPRAS', [
        'RECLUTAMIENTO', 'COMPRAS'
      ]);
      
      const comprasUser = await prisma.user.create({
        data: {
          email: 'compras@kram.com',
          password: await bcrypt.hash('123456', 10),
          name: 'Jose Luis Gonzalez',
          role: 'COMPRAS',
          accessibleModules: comprasModules,
          isActive: true
        }
      });
      console.log('   ✅ Usuario creado');
      console.log(`   ID: ${comprasUser.id}`);
    }

    // 6. Mostrar resumen
    console.log('\n🎉 Usuarios creados/modificados exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('========================================');
    console.log('1. Elizabeth Zurita Luna');
    console.log('   Email: recursoshumanos@kram.mx');
    console.log('   Contraseña: 123456');
    console.log('   Rol: RH');
    console.log('   Módulos: DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES, COMPRAS');
    console.log('');
    console.log('2. PRUEBAS HUB Reclutamiento');
    console.log('   Email: hub.r@kram.mx');
    console.log('   Contraseña: 123456');
    console.log('   Rol: PRODUCCION');
    console.log('   Módulos: DASHBOARD, RECLUTAMIENTO, COMPRAS');
    console.log('');
    console.log('3. PRUEBAS HUB Compras');
    console.log('   Email: hub.c@kram.mx');
    console.log('   Contraseña: 123456');
    console.log('   Rol: SISTEMAS');
    console.log('   Módulos: DASHBOARD, RECLUTAMIENTO, COMPRAS');
    console.log('');
    console.log('4. Jose Luis Gonzalez (modificado)');
    console.log('   Email: compras@kram.com');
    console.log('   Contraseña: (mantenida)');
    console.log('   Rol: COMPRAS');
    console.log('   Módulos: (mantenidos)');
    console.log('========================================');
    console.log('\n💡 Nota: Los usuarios ya están listos para usar en el sistema.');

  } catch (error) {
    console.error('❌ Error durante la creación de usuarios:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();