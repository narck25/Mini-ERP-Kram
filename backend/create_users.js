const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creando usuarios solicitados...\n');

  try {
    // 1. Verificar que los roles existen
    console.log('1. Verificando roles existentes...');
    const roles = await prisma.role.findMany();
    console.log(`   Roles encontrados: ${roles.map(r => r.name).join(', ')}`);

    // 2. Verificar que los departamentos existen
    console.log('\n2. Verificando departamentos existentes...');
    const departments = await prisma.department.findMany();
    console.log(`   Departamentos encontrados: ${departments.map(d => d.nombre).join(', ')}`);

    // 3. Verificar que los puestos de trabajo existen
    console.log('\n3. Verificando puestos de trabajo existentes...');
    const jobPositions = await prisma.jobPosition.findMany();
    console.log(`   Puestos encontrados: ${jobPositions.map(p => p.nombre).join(', ')}`);

    // 4. Función para obtener módulos por rol (copiada del seed)
    const getDefaultModulesByRole = (role) => {
      switch(role) {
        case 'ADMIN':
          return ['DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 'INCIDENCIAS', 'CONFIGURACION', 'REPORTES'];
        case 'RH':
          return ['DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 'INCIDENCIAS', 'REPORTES'];
        case 'SISTEMAS':
          return ['DASHBOARD', 'RECLUTAMIENTO', 'CONFIGURACION'];
        case 'COMPRAS':
          return ['DASHBOARD', 'RECLUTAMIENTO'];
        case 'PRODUCCION':
          return ['DASHBOARD', 'RECLUTAMIENTO'];
        default:
          return ['DASHBOARD'];
      }
    };

    // 5. Crear usuario 1: Gerente de RH - ELIZABETH ZURITA LUNA
    console.log('\n4. Creando usuario: Gerente de RH - ELIZABETH ZURITA LUNA');
    
    // Verificar si el usuario ya existe
    const existingRhUser = await prisma.user.findUnique({
      where: { email: 'recursoshumanos@kram.mx' }
    });

    if (existingRhUser) {
      console.log('   ⚠️  Usuario ya existe, actualizando...');
      await prisma.user.update({
        where: { email: 'recursoshumanos@kram.mx' },
        data: {
          name: 'ELIZABETH ZURITA LUNA',
          password: await bcrypt.hash('123456', 10),
          role: 'RH',
          accessibleModules: getDefaultModulesByRole('RH'),
          isActive: true
        }
      });
      console.log('   ✅ Usuario actualizado');
    } else {
      const rhUser = await prisma.user.create({
        data: {
          email: 'recursoshumanos@kram.mx',
          password: await bcrypt.hash('123456', 10),
          name: 'ELIZABETH ZURITA LUNA',
          role: 'RH',
          accessibleModules: getDefaultModulesByRole('RH'),
          isActive: true
        }
      });
      console.log('   ✅ Usuario creado');
      console.log(`   ID: ${rhUser.id}`);
    }

    // 6. Crear usuario 2: PRUEBAS HUB (perfil producción)
    console.log('\n5. Creando usuario: PRUEBAS HUB (perfil producción)');
    
    // Verificar si el usuario ya existe
    const existingHubUser = await prisma.user.findUnique({
      where: { email: 'hub@kram.mx' }
    });

    if (existingHubUser) {
      console.log('   ⚠️  Usuario ya existe, actualizando...');
      await prisma.user.update({
        where: { email: 'hub@kram.mx' },
        data: {
          name: 'PRUEBAS HUB',
          password: await bcrypt.hash('123456', 10),
          role: 'PRODUCCION',
          accessibleModules: getDefaultModulesByRole('PRODUCCION'),
          isActive: true
        }
      });
      console.log('   ✅ Usuario actualizado');
    } else {
      const hubUser = await prisma.user.create({
        data: {
          email: 'hub@kram.mx',
          password: await bcrypt.hash('123456', 10),
          name: 'PRUEBAS HUB',
          role: 'PRODUCCION',
          accessibleModules: getDefaultModulesByRole('PRODUCCION'),
          isActive: true
        }
      });
      console.log('   ✅ Usuario creado');
      console.log(`   ID: ${hubUser.id}`);
    }

    // 7. Crear empleados asociados a los usuarios
    console.log('\n6. Creando empleados asociados...');

    // Encontrar departamento RH
    const rhDepartment = departments.find(d => d.nombre === 'RH');
    const productionDepartment = departments.find(d => d.nombre === 'Producción');

    // Encontrar puestos de trabajo
    const gerenteRhPosition = jobPositions.find(p => p.nombre === 'Gerente de RH');
    const jefeProduccionPosition = jobPositions.find(p => p.nombre === 'Jefe de Producción');

    if (!rhDepartment || !productionDepartment) {
      console.log('   ⚠️  Algunos departamentos no existen, creando empleados sin departamento...');
    }

    if (!gerenteRhPosition || !jefeProduccionPosition) {
      console.log('   ⚠️  Algunos puestos no existen, creando empleados sin puesto...');
    }

    // Crear empleado para ELIZABETH ZURITA LUNA
    const rhUser = await prisma.user.findUnique({
      where: { email: 'recursoshumanos@kram.mx' }
    });

    if (rhUser) {
      const existingRhEmployee = await prisma.employee.findUnique({
        where: { userId: rhUser.id }
      });

      if (existingRhEmployee) {
        console.log('   ⚠️  Empleado RH ya existe, actualizando...');
        await prisma.employee.update({
          where: { userId: rhUser.id },
          data: {
            nombre: 'ELIZABETH ZURITA LUNA',
            rfc: 'ZULE000000000',
            curp: 'ZULE00000000000000',
            nss: '00000000000',
            fechaAlta: new Date(),
            estatus: 'Activo',
            puestoId: gerenteRhPosition?.id || null,
            departamento_id: rhDepartment?.id || '1',
            salarioMensual: 50000
          }
        });
        console.log('   ✅ Empleado RH actualizado');
      } else {
        await prisma.employee.create({
          data: {
            nombre: 'ELIZABETH ZURITA LUNA',
            rfc: 'ZULE000000001',
            curp: 'ZULE00000000000001',
            nss: '00000000001',
            fechaAlta: new Date(),
            estatus: 'Activo',
            puestoId: gerenteRhPosition?.id || null,
            departamento_id: rhDepartment?.id || '1',
            userId: rhUser.id,
            salarioMensual: 50000
          }
        });
        console.log('   ✅ Empleado RH creado');
      }
    }

    // Crear empleado para PRUEBAS HUB
    const hubUser = await prisma.user.findUnique({
      where: { email: 'hub@kram.mx' }
    });

    if (hubUser) {
      const existingHubEmployee = await prisma.employee.findUnique({
        where: { userId: hubUser.id }
      });

      if (existingHubEmployee) {
        console.log('   ⚠️  Empleado HUB ya existe, actualizando...');
        await prisma.employee.update({
          where: { userId: hubUser.id },
          data: {
            nombre: 'PRUEBAS HUB',
            rfc: 'HUBP000000000',
            curp: 'HUBP00000000000000',
            nss: '00000000000',
            fechaAlta: new Date(),
            estatus: 'Activo',
            puestoId: jefeProduccionPosition?.id || null,
            departamento_id: productionDepartment?.id || '1',
            salarioMensual: 45000
          }
        });
        console.log('   ✅ Empleado HUB actualizado');
      } else {
        await prisma.employee.create({
          data: {
            nombre: 'PRUEBAS HUB',
            rfc: 'HUBP000000002',
            curp: 'HUBP00000000000002',
            nss: '00000000002',
            fechaAlta: new Date(),
            estatus: 'Activo',
            puestoId: jefeProduccionPosition?.id || null,
            departamento_id: productionDepartment?.id || '1',
            userId: hubUser.id,
            salarioMensual: 45000
          }
        });
        console.log('   ✅ Empleado HUB creado');
      }
    }

    // 8. Mostrar resumen
    console.log('\n🎉 Usuarios creados exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('========================================');
    console.log('1. Gerente de RH - ELIZABETH ZURITA LUNA');
    console.log('   Email: recursoshumanos@kram.mx');
    console.log('   Contraseña: 123456');
    console.log('   Rol: RH');
    console.log('   Módulos: DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES');
    console.log('   Permisos: Acceso completo como Recursos Humanos');
    console.log('');
    console.log('2. PRUEBAS HUB');
    console.log('   Email: hub@kram.mx');
    console.log('   Contraseña: 123456');
    console.log('   Rol: PRODUCCION');
    console.log('   Módulos: DASHBOARD, RECLUTAMIENTO');
    console.log('   Permisos: Puede levantar vacantes (perfil producción)');
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