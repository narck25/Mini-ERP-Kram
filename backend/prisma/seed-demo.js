const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando script de DEMO para módulo de Reclutamiento');
  console.log('========================================================');

  // FASE 1: LIMPIEZA SEGURA
  console.log('\n🧹 FASE 1: Limpieza de datos transaccionales');
  console.log('--------------------------------------------');

  // Borrar en orden respetando relaciones (de más específico a más general)
  console.log('🗑️  Eliminando cotizaciones de compra...');
  await prisma.purchaseQuote.deleteMany();
  
  console.log('🗑️  Eliminando items de compra...');
  await prisma.purchaseItem.deleteMany();
  
  console.log('🗑️  Eliminando solicitudes de compra...');
  await prisma.purchaseRequest.deleteMany();
  
  console.log('🗑️  Eliminando candidatos RH...');
  await prisma.candidateRH.deleteMany();
  
  console.log('🗑️  Eliminando actividades de vacantes...');
  await prisma.jobActivity.deleteMany();
  
  console.log('🗑️  Eliminando comentarios de vacantes...');
  await prisma.vacancyComment.deleteMany();
  
  console.log('🗑️  Eliminando vacantes...');
  await prisma.jobVacancy.deleteMany();
  
  console.log('🗑️  Eliminando documentos de empleados...');
  await prisma.employeeDocument.deleteMany();
  
  console.log('🗑️  Eliminando empleados...');
  await prisma.employee.deleteMany();
  
  console.log('🗑️  Eliminando sesiones...');
  await prisma.session.deleteMany();
  
  console.log('🗑️  Eliminando usuarios...');
  await prisma.user.deleteMany();
  
  console.log('✅ Limpieza completada - Base de datos lista para demo');

  // FASE 2: CREACIÓN DE CATÁLOGOS BASE (si no existen)
  console.log('\n📁 FASE 2: Creación de catálogos base');
  console.log('--------------------------------------');

  // Crear departamentos necesarios para la demo
  const departamentosDemo = [
    { nombre: 'Recursos Humanos', descripcion: 'Departamento de Recursos Humanos' },
    { nombre: 'Administracion', descripcion: 'Departamento de Administración y Finanzas' },
    { nombre: 'SISTEMAS', descripcion: 'Departamento de Sistemas y Tecnología' }
  ];

  const departamentosCreados = {};
  
  for (const depto of departamentosDemo) {
    console.log(`📂 Creando/verificando departamento: ${depto.nombre}`);
    const departamento = await prisma.department.upsert({
      where: { nombre: depto.nombre },
      update: { estado: 'Activo' },
      create: {
        nombre: depto.nombre,
        descripcion: depto.descripcion,
        estado: 'Activo'
      }
    });
    departamentosCreados[depto.nombre] = departamento;
  }

  // Crear puestos necesarios para la demo
  console.log('\n👔 Creando puestos de trabajo para la demo');
  
  const puestosDemo = [
    { 
      nombre: 'Jefe de recursos humanos', 
      descripcion: 'Responsable del departamento de Recursos Humanos',
      nivelJerarquico: 'GERENTE',
      departamentoId: departamentosCreados['Recursos Humanos'].id
    },
    { 
      nombre: 'Gerente de administracion y finanzas', 
      descripcion: 'Responsable de administración y finanzas',
      nivelJerarquico: 'GERENTE',
      departamentoId: departamentosCreados['Administracion'].id
    },
    { 
      nombre: 'Jefe de sistemas', 
      descripcion: 'Responsable del departamento de Sistemas',
      nivelJerarquico: 'GERENTE',
      departamentoId: departamentosCreados['Sistemas'].id
    }
  ];

  const puestosCreados = {};
  
  for (const puesto of puestosDemo) {
    console.log(`👔 Creando/verificando puesto: ${puesto.nombre}`);
    const puestoCreado = await prisma.jobPosition.upsert({
      where: {
        nombre_departamentoId: {
          nombre: puesto.nombre,
          departamentoId: puesto.departamentoId
        }
      },
      update: { estado: 'Activo' },
      create: {
        nombre: puesto.nombre,
        descripcion: puesto.descripcion,
        nivelJerarquico: puesto.nivelJerarquico,
        estado: 'Activo',
        departamentoId: puesto.departamentoId
      }
    });
    puestosCreados[puesto.nombre] = puestoCreado;
  }

  // FASE 3: CREACIÓN DE USUARIOS DEMO
  console.log('\n👥 FASE 3: Creación de usuarios demo específicos');
  console.log('-----------------------------------------------');

  const password = 'Kram2024!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Usuario 1: Elizabeth Zurita Luna (RH)
  console.log('\n👤 Creando usuario 1: Elizabeth Zurita Luna (RH)');
  const usuarioRH = await prisma.user.create({
    data: {
      email: 'recursoshumanos@kram.mx',
      password: hashedPassword,
      name: 'Elizabeth Zurita Luna',
      role: 'RH',
      accessibleModules: ['DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 'INCIDENCIAS', 'REPORTES'],
      isActive: true
    }
  });

  // Crear empleado asociado al usuario RH
  await prisma.employee.create({
    data: {
      userId: usuarioRH.id,
      curp: 'ZULE800101MDFRRN09',
      rfc: 'ZULE800101ABC',
      nss: '12345678901',
      departamento_id: departamentosCreados['Recursos Humanos'].id,
      puestoId: puestosCreados['Jefe de recursos humanos'].id,
      nombre: 'Elizabeth Zurita Luna',
      nombres: 'Elizabeth',
      apellidoPaterno: 'Zurita',
      apellidoMaterno: 'Luna',
      correoElectronico: 'recursoshumanos@kram.mx',
      correoEmpresa: 'recursoshumanos@kram.mx',
      fechaAlta: new Date('2020-01-15'),
      estatus: 'Activo',
      salarioMensual: 45000
    }
  });
  console.log('✅ Usuario RH creado: Elizabeth Zurita Luna');

  // Usuario 2: Cristina Garduño Servin (Admin/Aprobador)
  console.log('\n👤 Creando usuario 2: Cristina Garduño Servin (Admin/Aprobador)');
  const usuarioAdmin = await prisma.user.create({
    data: {
      email: 'cristina.garduno@kram.mx',
      password: hashedPassword,
      name: 'Cristina Garduño Servin',
      role: 'ADMIN',
      accessibleModules: ['DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 'INCIDENCIAS', 'CONFIGURACION', 'REPORTES', 'COMPRAS'],
      isActive: true
    }
  });

  // Crear empleado asociado al usuario Admin
  await prisma.employee.create({
    data: {
      userId: usuarioAdmin.id,
      curp: 'GASC750512MDFRRN07',
      rfc: 'GASC750512ABC',
      nss: '23456789012',
      departamento_id: departamentosCreados['Administracion'].id,
      puestoId: puestosCreados['Gerente de administracion y finanzas'].id,
      nombre: 'Cristina Garduño Servin',
      nombres: 'Cristina',
      apellidoPaterno: 'Garduño',
      apellidoMaterno: 'Servin',
      correoElectronico: 'cristina.garduno@kram.mx',
      correoEmpresa: 'cristina.garduno@kram.mx',
      fechaAlta: new Date('2018-03-10'),
      estatus: 'Activo',
      salarioMensual: 55000
    }
  });
  console.log('✅ Usuario Admin creado: Cristina Garduño Servin');

  // Usuario 3: Fabian Axel Jimenez Linares (Sistemas)
  console.log('\n👤 Creando usuario 3: Fabian Axel Jimenez Linares (Sistemas)');
  const usuarioSistemas = await prisma.user.create({
    data: {
      email: 'sistemas@kram.mx',
      password: hashedPassword,
      name: 'Fabian Axel Jimenez Linares',
      role: 'SISTEMAS',
      accessibleModules: ['DASHBOARD', 'RECLUTAMIENTO', 'CONFIGURACION'],
      isActive: true
    }
  });

  // Crear empleado asociado al usuario Sistemas
  await prisma.employee.create({
    data: {
      userId: usuarioSistemas.id,
      curp: 'JILF900101HDFRRN08',
      rfc: 'JILF900101ABC',
      nss: '34567890123',
      departamento_id: departamentosCreados['Sistemas'].id,
      puestoId: puestosCreados['Jefe de sistemas'].id,
      nombre: 'Fabian Axel Jimenez Linares',
      nombres: 'Fabian Axel',
      apellidoPaterno: 'Jimenez',
      apellidoMaterno: 'Linares',
      correoElectronico: 'sistemas@kram.mx',
      correoEmpresa: 'sistemas@kram.mx',
      fechaAlta: new Date('2019-06-20'),
      estatus: 'Activo',
      salarioMensual: 50000
    }
  });
  console.log('✅ Usuario Sistemas creado: Fabian Axel Jimenez Linares');

  // FASE 4: RESUMEN DE LA DEMO
  console.log('\n🎉 FASE 4: Resumen de la configuración de demo');
  console.log('---------------------------------------------');
  console.log('✅ DEMO CONFIGURADA EXITOSAMENTE');
  console.log('\n📋 USUARIOS CREADOS:');
  console.log('====================');
  console.log('1. Elizabeth Zurita Luna');
  console.log('   • Email: recursoshumanos@kram.mx');
  console.log('   • Rol: RH (Recursos Humanos)');
  console.log('   • Departamento: Recursos Humanos');
  console.log('   • Puesto: Jefe de recursos humanos');
  console.log('   • Módulos: DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES');
  
  console.log('\n2. Cristina Garduño Servin');
  console.log('   • Email: cristina.garduno@kram.mx');
  console.log('   • Rol: ADMIN (Administrador/Aprobador)');
  console.log('   • Departamento: Administracion');
  console.log('   • Puesto: Gerente de administracion y finanzas');
  console.log('   • Módulos: TODOS (incluye CONFIGURACION y COMPRAS)');
  
  console.log('\n3. Fabian Axel Jimenez Linares');
  console.log('   • Email: sistemas@kram.mx');
  console.log('   • Rol: SISTEMAS (Jefe de Sistemas)');
  console.log('   • Departamento: Sistemas');
  console.log('   • Puesto: Jefe de sistemas');
  console.log('   • Módulos: DASHBOARD, RECLUTAMIENTO, CONFIGURACION');
  
  console.log('\n🔐 CREDENCIALES DE ACCESO:');
  console.log('==========================');
  console.log('• Contraseña para TODOS los usuarios: Kram2024!');
  console.log('• URL Frontend: http://localhost:3000');
  console.log('• URL Backend API: http://localhost:3001');
  
  console.log('\n🎯 FLUJO DE DEMO RECOMENDADO:');
  console.log('=============================');
  console.log('1. Iniciar sesión como Elizabeth (RH)');
  console.log('2. Crear una nueva vacante desde /reclutamiento/solicitar-vacante');
  console.log('3. Iniciar sesión como Cristina (Admin) para aprobar la vacante');
  console.log('4. Iniciar sesión como Fabian (Sistemas) para ver el proceso');
  console.log('5. Agregar candidatos a la vacante aprobada');
  
  console.log('\n⚠️  NOTA: Esta demo ha limpiado TODOS los datos existentes');
  console.log('   y creado un entorno específico para la demostración.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✨ Script de demo ejecutado exitosamente');
    console.log('🚀 Sistema listo para demostración del módulo de Reclutamiento');
  })
  .catch(async (e) => {
    console.error('❌ Error durante la ejecución del script:', e);
    await prisma.$disconnect();
    process.exit(1);
  });