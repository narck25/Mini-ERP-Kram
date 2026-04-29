const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 INICIANDO ESTANDARIZACIÓN DE PUESTOS DE TRABAJO');
  console.log('===================================================\n');

  try {
    // 1. ELIMINAR DUPLICADO EN COMPRAS ("Jefe de Compras" en minúsculas)
    console.log('🗑️  1. ELIMINANDO PUESTO DUPLICADO EN "COMPRAS"');
    console.log('-----------------------------------------------');
    
    // Buscar el puesto "Jefe de Compras" (exactamente en minúsculas)
    const puestoDuplicado = await prisma.jobPosition.findFirst({
      where: {
        nombre: 'Jefe de Compras',
        departamento: {
          nombre: 'COMPRAS'
        }
      },
      include: {
        _count: {
          select: {
            employees: true,
            jobVacancies: true
          }
        }
      }
    });
    
    if (!puestoDuplicado) {
      console.log('   🔍 No se encontró el puesto "Jefe de Compras" en el departamento COMPRAS');
      console.log('   🔄 Buscando cualquier puesto con nombre similar...');
      
      // Buscar cualquier puesto que contenga "Jefe de Compras" (case-insensitive)
      const todosPuestosCompras = await prisma.jobPosition.findMany({
        where: {
          departamento: {
            nombre: 'COMPRAS'
          }
        },
        include: {
          _count: {
            select: {
              employees: true,
              jobVacancies: true
            }
          }
        }
      });
      
      console.log(`   📋 Puestos encontrados en COMPRAS: ${todosPuestosCompras.length}`);
      todosPuestosCompras.forEach(p => {
        console.log(`      • ${p.nombre} (ID: ${p.id}) - Empleados: ${p._count.employees}, Vacantes: ${p._count.jobVacancies}`);
      });
      
      // Buscar el que tenga "Jefe de Compras" (case-insensitive)
      const puestoMinusculas = todosPuestosCompras.find(p => 
        p.nombre.toLowerCase() === 'jefe de compras'
      );
      
      if (puestoMinusculas) {
        console.log(`   ✅ Encontrado: ${puestoMinusculas.nombre} (ID: ${puestoMinusculas.id})`);
        
        // Verificar que no tiene empleados ni vacantes
        if (puestoMinusculas._count.employees > 0) {
          throw new Error(`⚠️  El puesto "${puestoMinusculas.nombre}" tiene ${puestoMinusculas._count.employees} empleados. No se puede eliminar.`);
        }
        
        if (puestoMinusculas._count.jobVacancies > 0) {
          console.log(`   ⚠️  El puesto tiene ${puestoMinusculas._count.jobVacancies} vacantes asociadas.`);
          console.log(`   🔄 Buscando puesto "JEFE DE COMPRAS" para reasignar vacantes...`);
          
          const puestoMayusculas = todosPuestosCompras.find(p => 
            p.nombre === 'JEFE DE COMPRAS'
          );
          
          if (puestoMayusculas) {
            console.log(`   🔄 Reasignando vacantes a "${puestoMayusculas.nombre}"...`);
            const vacantesReasignadas = await prisma.jobVacancy.updateMany({
              where: { puestoId: puestoMinusculas.id },
              data: { puestoId: puestoMayusculas.id }
            });
            console.log(`   ✅ ${vacantesReasignadas.count} vacantes reasignadas`);
          }
        }
        
        // Eliminar puesto duplicado
        console.log(`   🗑️  Eliminando puesto "${puestoMinusculas.nombre}"...`);
        await prisma.jobPosition.delete({
          where: { id: puestoMinusculas.id }
        });
        console.log(`   ✅ Puesto "${puestoMinusculas.nombre}" eliminado`);
      } else {
        console.log('   ✅ No se encontró ningún puesto "Jefe de Compras" (case-insensitive)');
      }
    } else {
      console.log(`   ✅ Encontrado: ${puestoDuplicado.nombre} (ID: ${puestoDuplicado.id})`);
      console.log(`     • Empleados: ${puestoDuplicado._count.employees}`);
      console.log(`     • Vacantes: ${puestoDuplicado._count.jobVacancies}`);
      
      // Verificar que no tiene empleados ni vacantes
      if (puestoDuplicado._count.employees > 0) {
        throw new Error(`⚠️  El puesto "${puestoDuplicado.nombre}" tiene ${puestoDuplicado._count.employees} empleados. No se puede eliminar.`);
      }
      
      if (puestoDuplicado._count.jobVacancies > 0) {
        console.log(`   ⚠️  El puesto tiene ${puestoDuplicado._count.jobVacancies} vacantes asociadas.`);
        console.log(`   🔄 Buscando puesto "JEFE DE COMPRAS" para reasignar vacantes...`);
        
        const puestoMayusculas = await prisma.jobPosition.findFirst({
          where: {
            nombre: 'JEFE DE COMPRAS',
            departamento: {
              nombre: 'COMPRAS'
            }
          }
        });
        
        if (puestoMayusculas) {
          console.log(`   🔄 Reasignando vacantes a "${puestoMayusculas.nombre}"...`);
          const vacantesReasignadas = await prisma.jobVacancy.updateMany({
            where: { puestoId: puestoDuplicado.id },
            data: { puestoId: puestoMayusculas.id }
          });
          console.log(`   ✅ ${vacantesReasignadas.count} vacantes reasignadas`);
        }
      }
      
      // Eliminar puesto duplicado
      console.log(`   🗑️  Eliminando puesto "${puestoDuplicado.nombre}"...`);
      await prisma.jobPosition.delete({
        where: { id: puestoDuplicado.id }
      });
      console.log(`   ✅ Puesto "${puestoDuplicado.nombre}" eliminado`);
    }
    
    // 2. ESTANDARIZAR TODOS LOS PUESTOS A MAYÚSCULAS
    console.log('\n🔠 2. ESTANDARIZANDO NOMBRES DE PUESTOS A MAYÚSCULAS');
    console.log('---------------------------------------------------');
    
    // Obtener todos los puestos
    const todosLosPuestos = await prisma.jobPosition.findMany({
      orderBy: { nombre: 'asc' }
    });
    
    console.log(`   📋 Total de puestos encontrados: ${todosLosPuestos.length}`);
    
    // Filtrar puestos que no están en mayúsculas
    const puestosParaActualizar = todosLosPuestos.filter(p => {
      const nombreUpper = p.nombre.toUpperCase();
      return p.nombre !== nombreUpper;
    });
    
    console.log(`   🔄 Puestos que necesitan actualización: ${puestosParaActualizar.length}`);
    
    if (puestosParaActualizar.length > 0) {
      console.log('   📝 Lista de puestos a actualizar:');
      puestosParaActualizar.forEach(p => {
        console.log(`      • "${p.nombre}" → "${p.nombre.toUpperCase()}"`);
      });
      
      // Actualizar cada puesto a mayúsculas
      let actualizados = 0;
      for (const puesto of puestosParaActualizar) {
        try {
          await prisma.jobPosition.update({
            where: { id: puesto.id },
            data: { nombre: puesto.nombre.toUpperCase() }
          });
          actualizados++;
          console.log(`   ✅ ${actualizados}/${puestosParaActualizar.length}: "${puesto.nombre}" → "${puesto.nombre.toUpperCase()}"`);
        } catch (error) {
          console.log(`   ⚠️  Error actualizando puesto "${puesto.nombre}": ${error.message}`);
        }
      }
      
      console.log(`\n   🎯 Total de puestos actualizados: ${actualizados}`);
    } else {
      console.log('   ✅ Todos los puestos ya están en MAYÚSCULAS');
    }
    
    // 3. VERIFICACIÓN FINAL
    console.log('\n📊 3. VERIFICACIÓN FINAL');
    console.log('------------------------');
    
    // Contar puestos por departamento
    const departamentosConPuestos = await prisma.department.findMany({
      include: {
        jobPositions: {
          orderBy: { nombre: 'asc' }
        },
        _count: {
          select: {
            jobPositions: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    
    console.log(`   📁 Departamentos con puestos: ${departamentosConPuestos.length}`);
    console.log('   📋 Distribución de puestos por departamento:');
    
    departamentosConPuestos.forEach(depto => {
      console.log(`      • ${depto.nombre}: ${depto._count.jobPositions} puesto(s)`);
      if (depto.jobPositions.length > 0) {
        depto.jobPositions.forEach(puesto => {
          console.log(`        - ${puesto.nombre} (${puesto.nivelJerarquico})`);
        });
      }
    });
    
    // Verificar si quedan duplicados case-insensitive
    console.log('\n🔍 4. DETECCIÓN DE DUPLICADOS RESIDUALES');
    console.log('----------------------------------------');
    
    const puestosFinales = await prisma.jobPosition.findMany({
      orderBy: { nombre: 'asc' }
    });
    
    const nombresMap = {};
    puestosFinales.forEach(puesto => {
      const nombreLower = puesto.nombre.toLowerCase();
      if (!nombresMap[nombreLower]) {
        nombresMap[nombreLower] = [];
      }
      nombresMap[nombreLower].push(puesto);
    });
    
    const duplicados = Object.entries(nombresMap).filter(([_, puestos]) => puestos.length > 1);
    
    if (duplicados.length > 0) {
      console.log(`   ⚠️  Se encontraron ${duplicados.length} nombres duplicados (case-insensitive):`);
      duplicados.forEach(([nombre, puestos]) => {
        console.log(`      • "${nombre}" aparece ${puestos.length} veces:`);
        puestos.forEach(p => {
          console.log(`        - ID: ${p.id}, Nombre: ${p.nombre}, Departamento: ${p.departamento?.nombre || 'N/A'}`);
        });
      });
    } else {
      console.log('   ✅ No se encontraron nombres duplicados (case-insensitive)');
    }
    
    console.log('\n🚀 ESTANDARIZACIÓN COMPLETADA EXITOSAMENTE');
    console.log('💡 Ejecuta nuevamente el script de diagnóstico para verificar los cambios:');
    console.log('   node backend/scripts/diagnostico-bd.js');
    
  } catch (error) {
    console.error('❌ ERROR DURANTE LA ESTANDARIZACIÓN:', error.message);
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