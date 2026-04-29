const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE BASE DE DATOS');
  console.log('==========================================\n');

  // A. MAPA DE DEPARTAMENTOS Y PUESTOS
  console.log('📊 A. MAPA DE DEPARTAMENTOS Y PUESTOS');
  console.log('--------------------------------------');
  
  const departamentos = await prisma.department.findMany({
    include: {
      _count: {
        select: {
          employees: true,
          jobPositions: true,
          jobVacancies: true,
          purchaseRequests: true
        }
      },
      jobPositions: {
        select: {
          id: true,
          nombre: true,
          nivelJerarquico: true,
          estado: true,
          _count: {
            select: {
              employees: true,
              jobVacancies: true
            }
          }
        }
      }
    },
    orderBy: { nombre: 'asc' }
  });

  console.log(`📁 Total de departamentos: ${departamentos.length}`);
  
  departamentos.forEach(depto => {
    console.log(`\n📂 ${depto.nombre} (${depto.estado})`);
    console.log(`   📝 Descripción: ${depto.descripcion || 'Sin descripción'}`);
    console.log(`   👥 Empleados: ${depto._count.employees}`);
    console.log(`   👔 Puestos: ${depto._count.jobPositions}`);
    console.log(`   📋 Vacantes: ${depto._count.jobVacancies}`);
    console.log(`   🛒 Solicitudes de compra: ${depto._count.purchaseRequests}`);
    
    if (depto.jobPositions.length > 0) {
      console.log(`   📋 Puestos específicos:`);
      depto.jobPositions.forEach(puesto => {
        console.log(`      • ${puesto.nombre} (${puesto.nivelJerarquico}) - ${puesto.estado}`);
        console.log(`        Empleados: ${puesto._count.employees}, Vacantes: ${puesto._count.jobVacancies}`);
      });
    }
  });

  // B. DETECCIÓN DE DUPLICADOS
  console.log('\n🔍 B. DETECCIÓN DE DUPLICADOS');
  console.log('-----------------------------');
  
  // 1. Departamentos con nombres similares (case-insensitive)
  console.log('\n1. 📂 Departamentos con nombres similares:');
  const nombresDepartamentos = departamentos.map(d => d.nombre.toLowerCase());
  const duplicadosDepartamentos = {};
  
  departamentos.forEach(depto => {
    const nombreLower = depto.nombre.toLowerCase();
    if (!duplicadosDepartamentos[nombreLower]) {
      duplicadosDepartamentos[nombreLower] = [];
    }
    duplicadosDepartamentos[nombreLower].push(depto);
  });
  
  let hayDuplicadosDepto = false;
  Object.entries(duplicadosDepartamentos).forEach(([nombre, deptos]) => {
    if (deptos.length > 1) {
      hayDuplicadosDepto = true;
      console.log(`   ⚠️  Nombre "${nombre}" aparece ${deptos.length} veces:`);
      deptos.forEach(d => console.log(`      • ID: ${d.id}, Nombre: ${d.nombre}, Estado: ${d.estado}`));
    }
  });
  
  if (!hayDuplicadosDepto) {
    console.log('   ✅ No se encontraron departamentos duplicados');
  }

  // 2. Puestos duplicados dentro del mismo departamento
  console.log('\n2. 👔 Puestos duplicados por departamento:');
  const puestosPorDepto = {};
  
  for (const depto of departamentos) {
    const puestosMap = {};
    depto.jobPositions.forEach(puesto => {
      const key = puesto.nombre.toLowerCase();
      if (!puestosMap[key]) {
        puestosMap[key] = [];
      }
      puestosMap[key].push(puesto);
    });
    
    const duplicados = Object.entries(puestosMap).filter(([_, puestos]) => puestos.length > 1);
    if (duplicados.length > 0) {
      console.log(`   ⚠️  En departamento "${depto.nombre}":`);
      duplicados.forEach(([nombre, puestos]) => {
        console.log(`      • Puesto "${nombre}" aparece ${puestos.length} veces:`);
        puestos.forEach(p => console.log(`        ID: ${p.id}, Nombre: ${p.nombre}, Estado: ${p.estado}`));
      });
    }
  }

  // 3. Usuarios con correos similares
  console.log('\n3. 👤 Usuarios con correos similares:');
  const usuarios = await prisma.user.findMany({
    include: {
      employee: {
        include: {
          departamento: true,
          puesto: true
        }
      }
    },
    orderBy: { email: 'asc' }
  });

  const correosMap = {};
  usuarios.forEach(user => {
    const correoLower = user.email.toLowerCase();
    if (!correosMap[correoLower]) {
      correosMap[correoLower] = [];
    }
    correosMap[correoLower].push(user);
  });

  let hayDuplicadosCorreo = false;
  Object.entries(correosMap).forEach(([correo, users]) => {
    if (users.length > 1) {
      hayDuplicadosCorreo = true;
      console.log(`   ⚠️  Correo "${correo}" aparece ${users.length} veces:`);
      users.forEach(u => console.log(`      • ID: ${u.id}, Nombre: ${u.name}, Rol: ${u.role}`));
    }
  });

  if (!hayDuplicadosCorreo) {
    console.log('   ✅ No se encontraron correos duplicados');
  }

  // 4. Nombres de usuarios similares
  console.log('\n4. 👤 Nombres de usuarios similares:');
  const nombresMap = {};
  usuarios.forEach(user => {
    const nombreLower = user.name.toLowerCase().trim();
    if (!nombresMap[nombreLower]) {
      nombresMap[nombreLower] = [];
    }
    nombresMap[nombreLower].push(user);
  });

  let hayNombresSimilares = false;
  Object.entries(nombresMap).forEach(([nombre, users]) => {
    if (users.length > 1) {
      hayNombresSimilares = true;
      console.log(`   ⚠️  Nombre "${nombre}" aparece ${users.length} veces:`);
      users.forEach(u => console.log(`      • ID: ${u.id}, Email: ${u.email}, Rol: ${u.role}`));
    }
  });

  if (!hayNombresSimilares) {
    console.log('   ✅ No se encontraron nombres duplicados');
  }

  // C. DISTRIBUCIÓN DE ROLES
  console.log('\n📈 C. DISTRIBUCIÓN DE ROLES');
  console.log('---------------------------');
  
  const distribucionRoles = {};
  usuarios.forEach(user => {
    if (!distribucionRoles[user.role]) {
      distribucionRoles[user.role] = 0;
    }
    distribucionRoles[user.role]++;
  });

  console.log('👥 Distribución de usuarios por rol:');
  Object.entries(distribucionRoles).forEach(([rol, cantidad]) => {
    console.log(`   • ${rol}: ${cantidad} usuario(s)`);
  });

  // D. REGISTROS HUÉRFANOS
  console.log('\n⚠️  D. REGISTROS HUÉRFANOS');
  console.log('------------------------');
  
  // 1. Usuarios sin empleado asociado
  const usuariosSinEmpleado = usuarios.filter(u => !u.employee);
  console.log(`\n1. 👤 Usuarios sin empleado asociado: ${usuariosSinEmpleado.length}`);
  if (usuariosSinEmpleado.length > 0) {
    usuariosSinEmpleado.forEach(u => {
      console.log(`   • ID: ${u.id}, Nombre: ${u.name}, Email: ${u.email}, Rol: ${u.role}`);
    });
  } else {
    console.log('   ✅ Todos los usuarios tienen empleado asociado');
  }

  // 2. Empleados sin departamento (esto no debería pasar por la relación requerida)
  const empleados = await prisma.employee.findMany({
    include: {
      departamento: true,
      puesto: true,
      user: true
    }
  });

  const empleadosSinPuesto = empleados.filter(e => !e.puestoId);
  console.log(`\n2. 👔 Empleados sin puesto asignado: ${empleadosSinPuesto.length}`);
  if (empleadosSinPuesto.length > 0) {
    empleadosSinPuesto.forEach(e => {
      console.log(`   • ID: ${e.id}, Nombre: ${e.nombre}, CURP: ${e.curp}`);
      console.log(`     Departamento: ${e.departamento?.nombre || 'Sin departamento'}`);
    });
  } else {
    console.log('   ✅ Todos los empleados tienen puesto asignado');
  }

  // 3. Puestos sin empleados
  const puestosSinEmpleados = [];
  for (const depto of departamentos) {
    for (const puesto of depto.jobPositions) {
      if (puesto._count.employees === 0) {
        puestosSinEmpleados.push({
          departamento: depto.nombre,
          puesto: puesto.nombre,
          nivel: puesto.nivelJerarquico
        });
      }
    }
  }

  console.log(`\n3. 📋 Puestos sin empleados asignados: ${puestosSinEmpleados.length}`);
  if (puestosSinEmpleados.length > 0) {
    puestosSinEmpleados.forEach(p => {
      console.log(`   • ${p.puesto} (${p.nivel}) en ${p.departamento}`);
    });
  } else {
    console.log('   ✅ Todos los puestos tienen al menos un empleado asignado');
  }

  // RESUMEN FINAL
  console.log('\n🎯 RESUMEN DEL DIAGNÓSTICO');
  console.log('==========================');
  console.log(`📁 Departamentos: ${departamentos.length}`);
  console.log(`👔 Puestos totales: ${departamentos.reduce((sum, d) => sum + d._count.jobPositions, 0)}`);
  console.log(`👥 Usuarios: ${usuarios.length}`);
  console.log(`👤 Empleados: ${empleados.length}`);
  
  const totalDuplicados = 
    (hayDuplicadosDepto ? 1 : 0) + 
    (hayDuplicadosCorreo ? 1 : 0) + 
    (hayNombresSimilares ? 1 : 0);
  
  console.log(`⚠️  Problemas detectados: ${totalDuplicados}`);
  console.log(`🔍 Registros huérfanos: ${usuariosSinEmpleado.length + empleadosSinPuesto.length + puestosSinEmpleados.length}`);
  
  console.log('\n💡 RECOMENDACIONES:');
  if (totalDuplicados > 0) {
    console.log('   1. Revisar y consolidar registros duplicados');
  }
  if (usuariosSinEmpleado.length > 0) {
    console.log('   2. Asociar usuarios sin empleado a registros de empleados');
  }
  if (empleadosSinPuesto.length > 0) {
    console.log('   3. Asignar puestos a empleados que no tienen');
  }
  if (puestosSinEmpleados.length > 0) {
    console.log('   4. Considerar eliminar puestos vacíos o asignar empleados');
  }
  
  console.log('\n✅ DIAGNÓSTICO COMPLETADO');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error durante el diagnóstico:', e);
    await prisma.$disconnect();
    process.exit(1);
  });