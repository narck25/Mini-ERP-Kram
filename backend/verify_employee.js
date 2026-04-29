// Script para verificar que el empleado es visible
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyEmployee() {
  console.log('🔍 VERIFICANDO VISIBILIDAD DEL EMPLEADO');
  console.log('=======================================\n');
  
  try {
    // 1. Buscar el usuario
    console.log('1. Buscando usuario: mario.negrete@kram.mx');
    const user = await prisma.user.findUnique({
      where: { email: 'mario.negrete@kram.mx' },
      include: {
        employee: {
          include: {
            puesto: true,
            departamento: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log(`✅ Usuario encontrado: ${user.name} (ID: ${user.id})`);
    console.log(`   • Rol: ${user.role}`);
    console.log(`   • Activo: ${user.isActive}`);
    console.log(`   • Módulos accesibles: ${JSON.stringify(user.accessibleModules)}`);
    
    // 2. Verificar registro de empleado
    console.log('\n2. Verificando registro de empleado...');
    
    if (!user.employee) {
      console.log('❌ No tiene registro de empleado vinculado');
      return;
    }
    
    const employee = user.employee;
    console.log(`✅ Registro de empleado encontrado (ID: ${employee.id})`);
    console.log(`   • Nombre completo: ${employee.nombres} ${employee.apellidoPaterno} ${employee.apellidoMaterno}`);
    console.log(`   • Correo personal: ${employee.correoElectronico}`);
    console.log(`   • Correo empresa: ${employee.correoEmpresa}`);
    console.log(`   • Puesto: ${employee.puesto?.nombre || 'No asignado'}`);
    console.log(`   • Departamento: ${employee.departamento?.nombre || 'No asignado'}`);
    console.log(`   • Estatus: ${employee.estatus}`);
    console.log(`   • Fecha alta: ${employee.fechaAlta}`);
    console.log(`   • CURP: ${employee.curp}`);
    console.log(`   • NSS: ${employee.nss}`);
    console.log(`   • RFC: ${employee.rfc}`);
    
    // 3. Verificar que todos los campos requeridos están completos
    console.log('\n3. Verificando campos requeridos...');
    
    const requiredFields = [
      { name: 'nombres', value: employee.nombres },
      { name: 'apellidoPaterno', value: employee.apellidoPaterno },
      { name: 'apellidoMaterno', value: employee.apellidoMaterno },
      { name: 'correoElectronico', value: employee.correoElectronico },
      { name: 'correoEmpresa', value: employee.correoEmpresa },
      { name: 'puestoId', value: employee.puestoId },
      { name: 'departamento_id', value: employee.departamento_id },
      { name: 'estatus', value: employee.estatus }
    ];
    
    let allFieldsComplete = true;
    requiredFields.forEach(field => {
      if (!field.value) {
        console.log(`   ❌ Campo ${field.name} está vacío`);
        allFieldsComplete = false;
      } else {
        console.log(`   ✅ Campo ${field.name}: ${field.value}`);
      }
    });
    
    if (allFieldsComplete) {
      console.log('\n🎉 TODOS LOS CAMPOS REQUERIDOS ESTÁN COMPLETOS');
    } else {
      console.log('\n⚠️  ALGUNOS CAMPOS REQUERIDOS ESTÁN VACÍOS');
    }
    
    // 4. Verificar que el empleado sería visible en la lista
    console.log('\n4. Verificando visibilidad en lista de empleados...');
    
    const visibleEmployees = await prisma.employee.findMany({
      where: {
        estatus: 'Activo',
        nombres: { not: null },
        apellidoPaterno: { not: null }
      },
      include: {
        puesto: true,
        departamento: true
      },
      take: 5
    });
    
    console.log(`   • Total de empleados activos con datos completos: ${visibleEmployees.length}`);
    
    const isVisible = visibleEmployees.some(emp => emp.id === employee.id);
    
    if (isVisible) {
      console.log('   ✅ El empleado está en la lista de empleados visibles');
    } else {
      console.log('   ⚠️  El empleado NO está en la lista de empleados visibles');
      console.log('   📋 Empleados visibles encontrados:');
      visibleEmployees.forEach((emp, index) => {
        console.log(`     ${index + 1}. ${emp.nombres} ${emp.apellidoPaterno} - ${emp.puesto?.nombre || 'Sin puesto'}`);
      });
    }
    
    console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
    console.log('==========================');
    console.log(`• Usuario: ${user.name} (${user.email})`);
    console.log(`• Registro de empleado: ${employee ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    console.log(`• Campos requeridos: ${allFieldsComplete ? '✅ COMPLETOS' : '⚠️  INCOMPLETOS'}`);
    console.log(`• Visibilidad en lista: ${isVisible ? '✅ VISIBLE' : '⚠️  NO VISIBLE'}`);
    
    if (employee && allFieldsComplete) {
      console.log('\n🎯 CONCLUSIÓN:');
      console.log('   El usuario "Mario Alberto Negrete Sanchez" debería ser visible');
      console.log('   en el módulo de empleados del ERP KRAM.');
      console.log('\n   📍 Puede acceder al módulo de empleados desde:');
      console.log('      • Frontend: /rh/empleados');
      console.log('      • O mediante el menú de navegación si tiene permisos');
    } else {
      console.log('\n⚠️  ADVERTENCIA:');
      console.log('   El usuario podría no ser visible en el módulo de empleados');
      console.log('   debido a campos incompletos o configuración incorrecta.');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEmployee();