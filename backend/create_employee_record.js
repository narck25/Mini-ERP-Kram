// Script para crear registro de empleado para Mario Alberto Negrete Sanchez
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createEmployeeRecord() {
  console.log('🚀 CREANDO REGISTRO DE EMPLEADO PARA MARIO ALBERTO NEGRETE SANCHEZ');
  console.log('==================================================================\n');
  
  try {
    // 1. Buscar el usuario
    console.log('🔍 Buscando usuario: mario.negrete@kram.mx');
    const user = await prisma.user.findUnique({
      where: { email: 'mario.negrete@kram.mx' }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado. Creando usuario primero...');
      console.log('⚠️  Ejecuta primero el script crear-usuarios-adicionales.js');
      return;
    }
    
    console.log(`✅ Usuario encontrado (ID: ${user.id})`);
    
    // 2. Buscar o crear departamento PROMOTORIA
    console.log('\n🔍 Buscando departamento PROMOTORIA...');
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
    } else {
      console.log(`✅ Departamento encontrado (ID: ${promotoriaDept.id})`);
    }
    
    // 3. Buscar o crear puesto COORDINADOR DE PROMOTORIA
    console.log('\n🔍 Buscando puesto COORDINADOR DE PROMOTORIA...');
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
    } else {
      console.log(`✅ Puesto encontrado (ID: ${coordinadorPromotoria.id})`);
    }
    
    // 4. Verificar si ya existe registro de empleado
    console.log('\n🔍 Verificando si ya existe registro de empleado...');
    const existingEmployee = await prisma.employee.findFirst({
      where: { userId: user.id }
    });
    
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
          userId: user.id,
          nombres: 'Mario Alberto',
          apellidoPaterno: 'Negrete',
          apellidoMaterno: 'Sanchez',
          correoElectronico: 'mario.negrete@kram.mx',
          correoEmpresa: 'mario.negrete@kram.mx',
          puestoId: coordinadorPromotoria.id,
          departamento_id: promotoriaDept.id,
          fechaAlta: new Date(),
          curp: 'NESA660101HDFNLR09',
          nss: '12345678902', // Cambiado para evitar conflicto
          rfc: 'NESA660101ABC',
          estatus: 'Activo',
          nombre: 'Mario Alberto Negrete Sanchez'
        }
      });
      
      console.log('✅ Registro de empleado creado exitosamente');
    }
    
    // 6. Verificar que el empleado ahora es visible
    console.log('\n🔍 Verificando que el empleado es visible...');
    const finalEmployee = await prisma.employee.findFirst({
      where: { userId: user.id },
      include: {
        puesto: true,
        departamento: true
      }
    });
    
    if (finalEmployee) {
      console.log('\n🎉 REGISTRO DE EMPLEADO CREADO EXITOSAMENTE');
      console.log('===========================================');
      console.log('\n📋 INFORMACIÓN DEL EMPLEADO:');
      console.log(`   • ID: ${finalEmployee.id}`);
      console.log(`   • Nombre completo: ${finalEmployee.nombres} ${finalEmployee.apellidoPaterno} ${finalEmployee.apellidoMaterno}`);
      console.log(`   • Correo personal: ${finalEmployee.correoElectronico}`);
      console.log(`   • Correo empresa: ${finalEmployee.correoEmpresa}`);
      console.log(`   • Puesto: ${finalEmployee.puesto?.nombre || 'No asignado'}`);
      console.log(`   • Departamento: ${finalEmployee.departamento?.nombre || 'No asignado'}`);
      console.log(`   • Estatus: ${finalEmployee.estatus}`);
      console.log(`   • Fecha alta: ${finalEmployee.fechaAlta}`);
      console.log('\n✅ El usuario ahora debería ser visible en el módulo de empleados.');
    } else {
      console.log('❌ No se pudo verificar el registro de empleado.');
    }
    
  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createEmployeeRecord();