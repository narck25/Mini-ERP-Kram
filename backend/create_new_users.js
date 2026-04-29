const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creando usuarios solicitados con perfiles completos de empleado...\n');

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

    // 2. Función para obtener o crear departamento
    const getOrCreateDepartment = async (nombre) => {
      let department = await prisma.department.findFirst({
        where: { nombre: { equals: nombre, mode: 'insensitive' } }
      });
      
      if (!department) {
        console.log(`   ℹ️  Creando departamento: ${nombre}`);
        department = await prisma.department.create({
          data: {
            nombre,
            descripcion: `Departamento de ${nombre}`,
            estado: 'Activo'
          }
        });
      }
      
      return department;
    };

    // 3. Función para obtener o crear puesto
    const getOrCreateJobPosition = async (nombre, departamentoId, nivelJerarquico = 'OPERATIVO') => {
      let position = await prisma.jobPosition.findFirst({
        where: { 
          nombre: { equals: nombre, mode: 'insensitive' },
          departamentoId 
        }
      });
      
      if (!position) {
        console.log(`   ℹ️  Creando puesto: ${nombre} (${nivelJerarquico})`);
        position = await prisma.jobPosition.create({
          data: {
            nombre,
            descripcion: `Puesto de ${nombre}`,
            nivelJerarquico,
            estado: 'Activo',
            departamentoId
          }
        });
      }
      
      return position;
    };

    // 4. Función para crear empleado completo
    const createCompleteEmployee = async (user, departmentName, positionName, nivelJerarquico = 'OPERATIVO') => {
      // Obtener o crear departamento
      const department = await getOrCreateDepartment(departmentName);
      
      // Obtener o crear puesto
      const position = await getOrCreateJobPosition(positionName, department.id, nivelJerarquico);
      
      // Generar datos únicos para el empleado
      const timestamp = Date.now();
      const rfcBase = user.name.split(' ').map(n => n.substring(0, 3).toUpperCase()).join('');
      const curpBase = user.name.split(' ').map(n => n.substring(0, 2).toUpperCase()).join('');
      
      const employeeData = {
        nombre: user.name,
        rfc: `${rfcBase}${timestamp.toString().substring(8, 12)}`,
        curp: `${curpBase}${timestamp.toString().substring(8, 12)}HDFLPR01`,
        nss: `12${timestamp.toString().substring(6, 12)}`,
        fechaAlta: new Date(),
        estatus: 'Activo',
        puestoId: position.id,
        departamento_id: department.id,
        userId: user.id,
        salarioMensual: 35000,
        
        // Datos adicionales para perfil completo
        apellidoPaterno: user.name.split(' ')[1] || 'Apellido',
        apellidoMaterno: user.name.split(' ')[2] || 'Materno',
        nombres: user.name.split(' ')[0],
        correoElectronico: user.email,
        telefonoMovil: `555${timestamp.toString().substring(6, 10)}`,
        fechaNacimiento: new Date('1985-01-15'),
        lugarNacimiento: 'Ciudad de México',
        nacionalidad: 'Mexicana',
        estadoCivil: 'Soltero(a)',
        sexo: 'Masculino',
        nivelAcademico: 'Licenciatura',
        direccionCompleta: 'Av. Principal #123, Col. Centro',
        cpFiscal: '01000',
        estado: 'Ciudad de México',
        telefonoCasa: '5551234567',
        horario: 'Lunes a Viernes 9:00 - 18:00',
        sucursal: 'Matriz',
        area: departmentName,
        banco: 'BBVA',
        numeroCuenta: `0123456789${timestamp.toString().substring(8, 12)}`,
        clabe: `01218000123456789${timestamp.toString().substring(8, 12)}`,
        contrato: 'Indeterminado',
        tallaCamisa: 'M',
        tallaPantalon: '32',
        tallaZapatos: '9',
        tallaPlayera: 'M',
        region: 'Centro',
        clave: `EMP${timestamp.toString().substring(8, 12)}`,
        jefeDirecto: 'Director General',
        sd: 32000,
        sdi: 35000,
        nivelJerarquico: nivelJerarquico,
        reportaAId: null // Se asignará después si hay jerarquía
      };

      // Verificar si ya existe un empleado para este usuario
      const existingEmployee = await prisma.employee.findUnique({
        where: { userId: user.id }
      });

      if (existingEmployee) {
        console.log(`   ⚠️  Empleado ya existe para ${user.name}, actualizando...`);
        const updatedEmployee = await prisma.employee.update({
          where: { userId: user.id },
          data: employeeData
        });
        console.log(`   ✅ Empleado actualizado: ${updatedEmployee.nombre}`);
        return updatedEmployee;
      } else {
        const employee = await prisma.employee.create({
          data: employeeData
        });
        console.log(`   ✅ Empleado creado: ${employee.nombre}`);
        console.log(`     RFC: ${employee.rfc}, NSS: ${employee.nss}`);
        return employee;
      }
    };

    // 5. Crear usuario 1: Elizabeth Zurita Luna (RH)
    console.log('1. Creando usuario: Elizabeth Zurita Luna (RH)');
    
    const rhModules = getModulesForUser('RH', [
      'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 
      'INCIDENCIAS', 'REPORTES', 'COMPRAS'
    ]);

    let rhUser;
    // Verificar si el usuario ya existe
    const existingRhUser = await prisma.user.findUnique({
      where: { email: 'recursoshumanos@kram.mx' }
    });

    if (existingRhUser) {
      console.log('   ⚠️  Usuario ya existe, actualizando...');
      rhUser = await prisma.user.update({
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
      rhUser = await prisma.user.create({
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

    // Crear empleado para Elizabeth Zurita Luna
    console.log('   🧑‍💼 Creando perfil de empleado...');
    await createCompleteEmployee(rhUser, 'Recursos Humanos', 'Gerente de RH', 'GERENTE');

    // 6. Crear usuario 2: PRUEBAS HUB Reclutamiento (PRODUCCION)
    console.log('\n2. Creando usuario: PRUEBAS HUB Reclutamiento (PRODUCCION)');
    
    const hubRModules = getModulesForUser('PRODUCCION', [
      'RECLUTAMIENTO', 'COMPRAS'
    ]);

    let hubRUser;
    // Verificar si el usuario ya existe
    const existingHubRUser = await prisma.user.findUnique({
      where: { email: 'hub.r@kram.mx' }
    });

    if (existingHubRUser) {
      console.log('   ⚠️  Usuario ya existe, actualizando...');
      hubRUser = await prisma.user.update({
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
      hubRUser = await prisma.user.create({
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

    // Crear empleado para PRUEBAS HUB Reclutamiento
    console.log('   🧑‍💼 Creando perfil de empleado...');
    await createCompleteEmployee(hubRUser, 'Producción', 'Supervisor de Producción', 'SUPERVISOR');

    // 7. Crear usuario 3: PRUEBAS HUB Compras (SISTEMAS)
    console.log('\n3. Creando usuario: PRUEBAS HUB Compras (SISTEMAS)');
    
    const hubCModules = getModulesForUser('SISTEMAS', [
      'RECLUTAMIENTO', 'COMPRAS'
    ]);

    let hubCUser;
    // Verificar si el usuario ya existe
    const existingHubCUser = await prisma.user.findUnique({
      where: { email: 'hub.c@kram.mx' }
    });

    if (existingHubCUser) {
      console.log('   ⚠️  Usuario ya existe, actualizando...');
      hubCUser = await prisma.user.update({
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
      hubCUser = await prisma.user.create({
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

    // Crear empleado para PRUEBAS HUB Compras
    console.log('   🧑‍💼 Creando perfil de empleado...');
    await createCompleteEmployee(hubCUser, 'Sistemas', 'Especialista en Soporte Técnico', 'OPERATIVO');

    // 8. Modificar usuario existente: compras@kram.com
    console.log('\n4. Modificando usuario: compras@kram.com');
    
    let comprasUser;
    // Verificar si el usuario existe
    const existingComprasUser = await prisma.user.findUnique({
      where: { email: 'compras@kram.com' }
    });

    if (existingComprasUser) {
      console.log('   ✅ Usuario encontrado, actualizando nombre...');
      comprasUser = await prisma.user.update({
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
      
      comprasUser = await prisma.user.create({
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

    // Crear empleado para Jose Luis Gonzalez
    console.log('   🧑‍💼 Creando perfil de empleado...');
    await createCompleteEmployee(comprasUser, 'Compras', 'Jefe de Compras', 'GERENTE');

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