const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmployee() {
  try {
    console.log('🔍 Buscando empleado: Mario Alberto Negrete Sanchez (mario.negrete@kram.mx)');
    
    // Buscar por correo
    const employeesByEmail = await prisma.employee.findMany({
      where: {
        OR: [
          { correoElectronico: 'mario.negrete@kram.mx' },
          { correoEmpresa: 'mario.negrete@kram.mx' }
        ]
      },
      include: {
        puesto: true,
        departamento: true
      }
    });
    
    // Buscar por nombre
    const employeesByName = await prisma.employee.findMany({
      where: {
        AND: [
          { nombres: { contains: 'Mario', mode: 'insensitive' } },
          { apellidoPaterno: { contains: 'Negrete', mode: 'insensitive' } },
          { apellidoMaterno: { contains: 'Sanchez', mode: 'insensitive' } }
        ]
      },
      include: {
        puesto: true,
        departamento: true
      }
    });
    
    console.log('\n📊 RESULTADOS DE LA BÚSQUEDA:');
    console.log('=' .repeat(50));
    
    if (employeesByEmail.length > 0) {
      console.log('\n✅ ENCONTRADO POR CORREO:');
      employeesByEmail.forEach((emp, index) => {
        console.log(`\nEmpleado ${index + 1}:`);
        console.log(`  ID: ${emp.id}`);
        console.log(`  Nombre: ${emp.nombres} ${emp.apellidoPaterno} ${emp.apellidoMaterno}`);
        console.log(`  Correo personal: ${emp.correoElectronico}`);
        console.log(`  Correo empresa: ${emp.correoEmpresa}`);
        console.log(`  Estatus: ${emp.estatus}`);
        console.log(`  Fecha alta: ${emp.fechaAlta}`);
        console.log(`  Puesto: ${emp.puesto?.nombre || 'No asignado'}`);
        console.log(`  Departamento: ${emp.departamento?.nombre || 'No asignado'}`);
      });
    } else {
      console.log('\n❌ NO ENCONTRADO POR CORREO');
    }
    
    if (employeesByName.length > 0) {
      console.log('\n✅ ENCONTRADO POR NOMBRE:');
      employeesByName.forEach((emp, index) => {
        console.log(`\nEmpleado ${index + 1}:`);
        console.log(`  ID: ${emp.id}`);
        console.log(`  Nombre: ${emp.nombres} ${emp.apellidoPaterno} ${emp.apellidoMaterno}`);
        console.log(`  Correo personal: ${emp.correoElectronico}`);
        console.log(`  Correo empresa: ${emp.correoEmpresa}`);
        console.log(`  Estatus: ${emp.estatus}`);
        console.log(`  Fecha alta: ${emp.fechaAlta}`);
        console.log(`  Puesto: ${emp.puesto?.nombre || 'No asignado'}`);
        console.log(`  Departamento: ${emp.departamento?.nombre || 'No asignado'}`);
      });
    } else {
      console.log('\n❌ NO ENCONTRADO POR NOMBRE');
    }
    
    if (employeesByEmail.length === 0 && employeesByName.length === 0) {
      console.log('\n⚠️  El empleado NO existe en la base de datos.');
    }
    
  } catch (error) {
    console.error('❌ Error al buscar empleado:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployee();