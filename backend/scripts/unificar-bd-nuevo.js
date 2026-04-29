const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 INICIANDO UNIFICACIÓN DE BASE DE DATOS (VERSIÓN CORREGIDA)');
  console.log('=============================================================\n');

  try {
    // 1. UNIFICAR "ADMINISTRACION" (MAYÚSCULAS es el oficial)
    console.log('📂 1. UNIFICANDO DEPARTAMENTOS "ADMINISTRACION"');
    console.log('-----------------------------------------------');
    
    const destinoAdminId = 'cmmkxm6hq0000570k773p0cch'; // ADMINISTRACION (mantener - oficial)
    const origenAdminId = 'cmnqynose0001rx4o371of16j';  // Administracion (eliminar)
    
    // Verificar que existen los departamentos
    const destinoAdmin = await prisma.department.findUnique({
      where: { id: destinoAdminId }
    });
    
    const origenAdmin = await prisma.department.findUnique({
      where: { id: origenAdminId },
      include: {
        _count: {
          select: {
            jobPositions: true,
            employees: true,
            jobVacancies: true,
            purchaseRequests: true
          }
        }
      }
    });
    
    if (!destinoAdmin) {
      throw new Error(`Departamento destino no encontrado: ${destinoAdminId}`);
    }
    
    if (!origenAdmin) {
      throw new Error(`Departamento origen no encontrado: ${origenAdminId}`);
    }
    
    console.log(`   Destino (Oficial): ${destinoAdmin.nombre} (ID: ${destinoAdminId})`);
    console.log(`   Origen (Eliminar): ${origenAdmin.nombre} (ID: ${origenAdminId})`);
    console.log(`   Puestos en origen: ${origenAdmin._count.jobPositions}`);
    console.log(`   Empleados en origen: ${origenAdmin._count.employees}`);
    console.log(`   Vacantes en origen: ${origenAdmin._count.jobVacancies}`);
    console.log(`   Solicitudes de compra en origen: ${origenAdmin._count.purchaseRequests}`);
    
    // Mover puestos del origen al destino
    if (origenAdmin._count.jobPositions > 0) {
      console.log(`   🚚 Moviendo ${origenAdmin._count.jobPositions} puestos...`);
      try {
        const puestosMovidos = await prisma.jobPosition.updateMany({
          where: { departamentoId: origenAdminId },
          data: { departamentoId: destinoAdminId }
        });
        console.log(`   ✅ ${puestosMovidos.count} puestos movidos de ${origenAdmin.nombre} a ${destinoAdmin.nombre}`);
      } catch (error) {
        console.log(`   ⚠️  Error moviendo puestos: ${error.message}`);
        console.log(`   🔄 Intentando con campo 'departmentId'...`);
        const puestosMovidos = await prisma.jobPosition.updateMany({
          where: { departmentId: origenAdminId },
          data: { departmentId: destinoAdminId }
        });
        console.log(`   ✅ ${puestosMovidos.count} puestos movidos de ${origenAdmin.nombre} a ${destinoAdmin.nombre}`);
      }
    } else {
      console.log('   ✅ No hay puestos que mover');
    }
    
    // Mover empleados del origen al destino
    if (origenAdmin._count.employees > 0) {
      console.log(`   👥 Moviendo ${origenAdmin._count.employees} empleados...`);
      const empleadosMovidos = await prisma.employee.updateMany({
        where: { departamento_id: origenAdminId },
        data: { departamento_id: destinoAdminId }
      });
      console.log(`   ✅ ${empleadosMovidos.count} empleados movidos de ${origenAdmin.nombre} a ${destinoAdmin.nombre}`);
    } else {
      console.log('   ✅ No hay empleados que mover');
    }
    
    // Eliminar departamento origen
    console.log(`   🗑️  Eliminando departamento ${origenAdmin.nombre}...`);
    await prisma.department.delete({
      where: { id: origenAdminId }
    });
    console.log(`   ✅ Departamento ${origenAdmin.nombre} eliminado`);
    
    // 2. UNIFICAR "COMPRAS" (MAYÚSCULAS es el oficial)
    console.log('\n📂 2. UNIFICANDO DEPARTAMENTOS "COMPRAS"');
    console.log('----------------------------------------');
    
    const destinoComprasId = 'cmmkxm6il0001570kbxa0kgz6'; // COMPRAS (mantener - oficial)
    const origenComprasId = 'cmmckozvd000d2ds4qn3t2pnt';  // Compras (eliminar)
    
    // Verificar que existen los departamentos
    const destinoCompras = await prisma.department.findUnique({
      where: { id: destinoComprasId }
    });
    
    const origenCompras = await prisma.department.findUnique({
      where: { id: origenComprasId },
      include: {
        _count: {
          select: {
            jobPositions: true,
            employees: true,
            jobVacancies: true,
            purchaseRequests: true
          }
        }
      }
    });
    
    if (!destinoCompras) {
      throw new Error(`Departamento destino no encontrado: ${destinoComprasId}`);
    }
    
    if (!origenCompras) {
      throw new Error(`Departamento origen no encontrado: ${origenComprasId}`);
    }
    
    console.log(`   Destino (Oficial): ${destinoCompras.nombre} (ID: ${destinoComprasId})`);
    console.log(`   Origen (Eliminar): ${origenCompras.nombre} (ID: ${origenComprasId})`);
    console.log(`   Puestos en origen: ${origenCompras._count.jobPositions}`);
    console.log(`   Empleados en origen: ${origenCompras._count.employees}`);
    console.log(`   Vacantes en origen: ${origenCompras._count.jobVacancies}`);
    console.log(`   Solicitudes de compra en origen: ${origenCompras._count.purchaseRequests}`);
    
    // Mover puestos del origen al destino
    if (origenCompras._count.jobPositions > 0) {
      console.log(`   🚚 Moviendo ${origenCompras._count.jobPositions} puestos...`);
      try {
        const puestosMovidos = await prisma.jobPosition.updateMany({
          where: { departamentoId: origenComprasId },
          data: { departamentoId: destinoComprasId }
        });
        console.log(`   ✅ ${puestosMovidos.count} puestos movidos de ${origenCompras.nombre} a ${destinoCompras.nombre}`);
      } catch (error) {
        console.log(`   ⚠️  Error moviendo puestos: ${error.message}`);
        console.log(`   🔄 Intentando con campo 'departmentId'...`);
        const puestosMovidos = await prisma.jobPosition.updateMany({
          where: { departmentId: origenComprasId },
          data: { departmentId: destinoComprasId }
        });
        console.log(`   ✅ ${puestosMovidos.count} puestos movidos de ${origenCompras.nombre} a ${destinoCompras.nombre}`);
      }
    } else {
      console.log('   ✅ No hay puestos que mover');
    }
    
    // Mover empleados del origen al destino (por si acaso)
    if (origenCompras._count.employees > 0) {
      console.log(`   👥 Moviendo ${origenCompras._count.employees} empleados...`);
      const empleadosMovidos = await prisma.employee.updateMany({
        where: { departamento_id: origenComprasId },
        data: { departamento_id: destinoComprasId }
      });
      console.log(`   ✅ ${empleadosMovidos.count} empleados movidos de ${origenCompras.nombre} a ${destinoCompras.nombre}`);
    } else {
      console.log('   ✅ No hay empleados que mover');
    }
    
    // Eliminar departamento origen
    console.log(`   🗑️  Eliminando departamento ${origenCompras.nombre}...`);
    await prisma.department.delete({
      where: { id: origenComprasId }
    });
    console.log(`   ✅ Departamento ${origenCompras.nombre} eliminado`);
    
    // 3. LIMPIAR "Sistemas" - Puesto duplicado
    console.log('\n👔 3. LIMPIANDO PUESTO DUPLICADO EN "Sistemas"');
    console.log('---------------------------------------------');
    
    const mantenerPuestoId = 'cmnqynou60008rx4op87ify9z'; // "Jefe de sistemas" (mantener - tiene 1 empleado)
    const eliminarPuestoId = 'cmmckozw7000k2ds4yz5blux7'; // "Jefe de Sistemas" (eliminar - tiene 0 empleados)
    
    // Verificar que existen los puestos
    const mantenerPuesto = await prisma.jobPosition.findUnique({
      where: { id: mantenerPuestoId },
      include: {
        _count: {
          select: {
            employees: true,
            jobVacancies: true
          }
        }
      }
    });
    
    const eliminarPuesto = await prisma.jobPosition.findUnique({
      where: { id: eliminarPuestoId },
      include: {
        _count: {
          select: {
            employees: true,
            jobVacancies: true
          }
        }
      }
    });
    
    if (!mantenerPuesto) {
      throw new Error(`Puesto a mantener no encontrado: ${mantenerPuestoId}`);
    }
    
    if (!eliminarPuesto) {
      throw new Error(`Puesto a eliminar no encontrado: ${eliminarPuestoId}`);
    }
    
    console.log(`   Mantener: ${mantenerPuesto.nombre} (ID: ${mantenerPuestoId})`);
    console.log(`     • Empleados: ${mantenerPuesto._count.employees}`);
    console.log(`     • Vacantes: ${mantenerPuesto._count.jobVacancies}`);
    
    console.log(`   Eliminar: ${eliminarPuesto.nombre} (ID: ${eliminarPuestoId})`);
    console.log(`     • Empleados: ${eliminarPuesto._count.employees}`);
    console.log(`     • Vacantes: ${eliminarPuesto._count.jobVacancies}`);
    
    // Actualizar nombre del puesto a mantener a MAYÚSCULAS si RH lo requiere
    console.log(`   🔄 Actualizando nombre del puesto a "JEFE DE SISTEMAS"...`);
    await prisma.jobPosition.update({
      where: { id: mantenerPuestoId },
      data: { nombre: 'JEFE DE SISTEMAS' }
    });
    console.log(`   ✅ Nombre actualizado a "JEFE DE SISTEMAS"`);
    
    // Verificar que el puesto a eliminar no tiene empleados
    if (eliminarPuesto._count.employees > 0) {
      throw new Error(`⚠️  El puesto a eliminar tiene ${eliminarPuesto._count.employees} empleados. No se puede eliminar.`);
    }
    
    if (eliminarPuesto._count.jobVacancies > 0) {
      console.log(`   ⚠️  El puesto tiene ${eliminarPuesto._count.jobVacancies} vacantes asociadas.`);
      console.log(`   🔄 Reasignando vacantes al puesto a mantener...`);
      
      // Reasignar vacantes al puesto a mantener
      const vacantesReasignadas = await prisma.jobVacancy.updateMany({
        where: { puestoId: eliminarPuestoId },
        data: { puestoId: mantenerPuestoId }
      });
      console.log(`   ✅ ${vacantesReasignadas.count} vacantes reasignadas`);
    }
    
    // Eliminar puesto duplicado
    console.log(`   🗑️  Eliminando puesto ${eliminarPuesto.nombre}...`);
    await prisma.jobPosition.delete({
      where: { id: eliminarPuestoId }
    });
    console.log(`   ✅ Puesto ${eliminarPuesto.nombre} eliminado`);
    
    // RESUMEN FINAL
    console.log('\n🎯 RESUMEN DE LA UNIFICACIÓN');
    console.log('============================');
    console.log('✅ OPERACIONES COMPLETADAS:');
    console.log('   1. Departamentos "ADMINISTRACION" unificados (MAYÚSCULAS es oficial)');
    console.log('   2. Departamentos "COMPRAS" unificados (MAYÚSCULAS es oficial)');
    console.log('   3. Puesto duplicado en "Sistemas" eliminado y nombre actualizado a MAYÚSCULAS');
    
    console.log('\n📊 VERIFICACIÓN FINAL:');
    
    // Verificar departamentos restantes
    const departamentosFinal = await prisma.department.findMany({
      orderBy: { nombre: 'asc' }
    });
    
    console.log(`   📁 Departamentos totales: ${departamentosFinal.length}`);
    console.log('   📋 Lista de departamentos:');
    departamentosFinal.forEach(depto => {
      console.log(`      • ${depto.nombre} (${depto.estado})`);
    });
    
    console.log('\n🚀 UNIFICACIÓN COMPLETADA EXITOSAMENTE');
    console.log('💡 Ejecuta nuevamente el script de diagnóstico para verificar los cambios:');
    console.log('   node backend/scripts/diagnostico-bd.js');
    
  } catch (error) {
    console.error('❌ ERROR DURANTE LA UNIFICACIÓN:', error.message);
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