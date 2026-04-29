// Script para crear el usuario Mario Alberto Negrete Sanchez
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createMarioUser() {
  console.log('🚀 CREANDO USUARIO MARIO ALBERTO NEGRETE SANCHEZ');
  console.log('================================================\n');
  
  try {
    // 1. Verificar si el usuario ya existe
    console.log('🔍 Verificando si el usuario ya existe: mario.negrete@kram.mx');
    
    const existingUser = await prisma.user.findUnique({
      where: { email: 'mario.negrete@kram.mx' }
    });
    
    // 2. Crear hash de contraseña
    const password = 'Kram2024!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    let userId;
    
    if (existingUser) {
      console.log('✅ Usuario ya existe, actualizando información...');
      
      // Actualizar usuario existente
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: 'Mario Alberto Negrete Sanchez',
          role: 'PRODUCCION',
          password: passwordHash,
          isActive: true,
          accessibleModules: ['DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 'INCIDENCIAS', 'REPORTES']
        }
      });
      
      userId = existingUser.id;
      console.log('✅ Usuario actualizado exitosamente');
    } else {
      console.log('➕ Creando nuevo usuario...');
      
      // Crear nuevo usuario
      const newUser = await prisma.user.create({
        data: {
          email: 'mario.negrete@kram.mx',
          name: 'Mario Alberto Negrete Sanchez',
          password: passwordHash,
          role: 'PRODUCCION',
          isActive: true,
          accessibleModules: ['DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 'INCIDENCIAS', 'REPORTES']
        }
      });
      
      userId = newUser.id;
      console.log(`✅ Usuario creado exitosamente (ID: ${userId})`);
    }
    
    // 3. Verificar si el empleado ya existe
    console.log('\n🔍 Verificando si el registro de empleado ya existe...');
    
    const existingEmployee = await prisma.employee.findFirst({
      where: { userId: userId }
    });
    
    // 4. Obtener o crear departamento y puesto
    console.log('🔍 Buscando departamento PROMOTORIA...');
    
    let promotoriaDept = await prisma.department.findFirst({
      where: { nombre: { contains: 'PROMOTORIA', mode: 'insensitive' } }
    });
    
    if (!promotoriaDept) {
      console.log('➕ Creando departamento PROMOTORIA...');
      promotoriaDept = await prisma.department.create({
        data: {
          nombre: 'PROMOTORIA',
          descripcion: 'Departamento de Promotoría',
          estatus: 'Activo'
        }
      });
      console.log(`✅ Departamento creado (ID: ${promotoriaDept.id})`);
    }
    
    console.log('🔍 Buscando puesto COORDINADOR DE PROMOTORIA...');
    
    let coordinadorPromotoria = await prisma.jobPosition.findFirst({
      where: { nombre: { contains: 'COORDINADOR DE PROMOTORIA', mode: 'insensitive' } }
    });
    
    if (!coordinadorPromotoria) {
      console.log('➕ Creando puesto COORDINADOR DE PROMOTORIA...');
      coordinadorPromotoria = await prisma.jobPosition.create({
        data: {
          nombre: 'COORDINADOR DE PROMOTORIA',
          descripcion: 'Coordinador de Promotoría',
          nivelJerarquico: 'Coordinador',
          estatus: 'Activo',
          departamento_id: promotoriaDept.id
        }
      });
      console.log(`✅ Puesto creado (ID: ${coordinadorPromotoria.id})`);
    }
    
    // 5. Crear o actualizar registro de empleado
    if (existingEmployee) {
      console.log('✅ Registro de empleado ya existe, actualizando...');
      
      await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          nombres: 'Mario Alberto',
          apellidoPaterno: 'Negrete',
          apellidoMaterno: 'Sanchez',
          correoElectronico: 'mario.negrete@kram.mx',
          correoEmpresa: 'mario.negrete@kram.mx',
          puestoId: coordinadorPromotoria.id,
          departamento_id: promotoriaDept.id,
          fechaAlta: new Date(),
          curp: 'NESA660101HDFNLR09',
          nss: '12345678901',
          rfc: 'NESA660101ABC',
          estatus: 'Activo',
          nombre: 'Mario Alberto Negrete Sanchez'
        }
      });
      
      console.log('✅ Registro de empleado actualizado exitosamente');
    } else {
      console.log('➕ Creando nuevo registro de empleado...');
      
      await prisma.employee.create({
        data: {
          userId: userId,
          nombres: 'Mario Alberto',
          apellidoPaterno: 'Negrete',
          apellidoMaterno: 'Sanchez',
          correoElectronico: 'mario.negrete@kram.mx',
          correoEmpresa: 'mario.negrete@kram.mx',
          puestoId: coordinadorPromotoria.id,
          departamento_id: promotoriaDept.id,
          fechaAlta: new Date(),
          curp: 'NESA660101HDFNLR09',
          nss: '12345678901',
          rfc: 'NESA660101ABC',
          estatus: 'Activo',
          nombre: 'Mario Alberto Negrete Sanchez'
        }
      });
      
      console.log('✅ Registro de empleado creado exitosamente');
    }
    
    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE');
    console.log('==================================');
    console.log('\n📋 CREDENCIALES DE ACCESO:');
    console.log('   • Nombre: Mario Alberto Negrete Sanchez');
    console.log('   • Email: mario.negrete@kram.mx');
    console.log('   • Contraseña: Kram2024!');
    console.log('   • Rol: PRODUCCION (GERENTE)');
    console.log('   • Módulos accesibles: DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES');
    console.log('   • Puesto: COORDINADOR DE PROMOTORIA');
    console.log('   • Departamento: PROMOTORIA');
    console.log('\n✅ El usuario ahora debería ser visible en el módulo de empleados.');
    
  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMarioUser();