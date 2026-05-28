const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (incluyendo nuevos modelos)
  await prisma.session.deleteMany();
  await prisma.jobActivity.deleteMany();
  await prisma.jobVacancy.deleteMany();
  await prisma.candidateRH.deleteMany();
  await prisma.vacancyComment.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.jobPosition.deleteMany(); // Eliminar puestos antes que departamentos
  await prisma.department.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Datos anteriores eliminados');

  // Crear roles
  const roles = [
    { name: 'ADMIN', description: 'Administrador del sistema', permissions: ['*'] },
    { name: 'RH', description: 'Recursos Humanos', permissions: ['users.read', 'users.write', 'vacancies.*'] },
    { name: 'SISTEMAS', description: 'Departamento de Sistemas', permissions: ['system.*', 'vacancies.create'] },
    { name: 'COMPRAS', description: 'Departamento de Compras', permissions: ['purchases.*', 'vacancies.create'] },
    { name: 'PRODUCCION', description: 'Departamento de Producción', permissions: ['production.*', 'vacancies.create'] }
  ];

  for (const roleData of roles) {
    await prisma.role.create({
      data: roleData
    });
  }

  console.log('✅ Roles creados');

  // Crear usuarios con módulos por defecto según rol
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Definir módulos por defecto según rol
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

  const users = [
    {
      email: 'admin@kram.com',
      password: hashedPassword,
      name: 'Administrador Principal',
      role: 'ADMIN',
      accessibleModules: getDefaultModulesByRole('ADMIN'),
      isActive: true
    },
    {
      email: 'rh@kram.com',
      password: hashedPassword,
      name: 'María Rodríguez',
      role: 'RH',
      accessibleModules: getDefaultModulesByRole('RH'),
      isActive: true
    },
    {
      email: 'sistemas@kram.com',
      password: hashedPassword,
      name: 'Carlos López',
      role: 'SISTEMAS',
      accessibleModules: getDefaultModulesByRole('SISTEMAS'),
      isActive: true
    },
    {
      email: 'compras@kram.com',
      password: hashedPassword,
      name: 'Ana Martínez',
      role: 'COMPRAS',
      accessibleModules: getDefaultModulesByRole('COMPRAS'),
      isActive: true
    },
    {
      email: 'sistemas2@kram.com',
      password: hashedPassword,
      name: 'Roberto Sánchez',
      role: 'SISTEMAS',
      accessibleModules: getDefaultModulesByRole('SISTEMAS'),
      isActive: true
    },
    {
      email: 'compras2@kram.com',
      password: hashedPassword,
      name: 'Laura González',
      role: 'COMPRAS',
      accessibleModules: getDefaultModulesByRole('COMPRAS'),
      isActive: true
    },
    {
      email: 'produccion@kram.com',
      password: hashedPassword,
      name: 'Jefe de Producción',
      role: 'PRODUCCION',
      accessibleModules: getDefaultModulesByRole('PRODUCCION'),
      isActive: true
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData
    });
    createdUsers.push(user);
  }

  console.log('✅ Usuarios creados');

  // Crear departamentos primero
  const departments = [
    {
      nombre: 'SISTEMAS',
      descripcion: 'Departamento de Tecnologías de la Información'
    },
    {
      nombre: 'COMPRAS',
      descripcion: 'Departamento de Adquisiciones y Proveedores'
    },
    {
      nombre: 'RH',
      descripcion: 'Recursos Humanos'
    },
    {
      nombre: 'Administración',
      descripcion: 'Administración y Finanzas'
    },
    {
      nombre: 'Ventas',
      descripcion: 'Departamento de Ventas'
    },
    {
      nombre: 'Marketing',
      descripcion: 'Marketing y Publicidad'
    },
    {
      nombre: 'PRODUCCION',
      descripcion: 'Departamento de Producción'
    }
  ];

  const createdDepartments = [];
  for (const deptData of departments) {
    const department = await prisma.department.create({
      data: deptData
    });
    createdDepartments.push(department);
  }

  console.log('✅ Departamentos creados');

  // Crear puestos de trabajo para cada departamento
  const jobPositions = [
    // Puestos para Sistemas
    {
      nombre: 'Jefe de Sistemas',
      descripcion: 'Responsable del departamento de TI',
      nivelJerarquico: 'GERENTE',
      departamentoId: createdDepartments.find(d => d.nombre === 'SISTEMAS').id
    },
    {
      nombre: 'Desarrollador Senior',
      descripcion: 'Desarrollador con experiencia avanzada',
      nivelJerarquico: 'OPERATIVO',
      departamentoId: createdDepartments.find(d => d.nombre === 'SISTEMAS').id
    },
    {
      nombre: 'Especialista en Soporte Técnico',
      descripcion: 'Soporte técnico a usuarios',
      nivelJerarquico: 'OPERATIVO',
      departamentoId: createdDepartments.find(d => d.nombre === 'SISTEMAS').id
    },
    // Puestos para Compras
    {
      nombre: 'Jefe de Compras',
      descripcion: 'Responsable del departamento de Compras',
      nivelJerarquico: 'GERENTE',
      departamentoId: createdDepartments.find(d => d.nombre === 'COMPRAS').id
    },
    {
      nombre: 'Analista de Compras',
      descripcion: 'Análisis y gestión de compras',
      nivelJerarquico: 'OPERATIVO',
      departamentoId: createdDepartments.find(d => d.nombre === 'COMPRAS').id
    },
    {
      nombre: 'Coordinador de Logística',
      descripcion: 'Coordinación logística de compras',
      nivelJerarquico: 'COORDINADOR',
      departamentoId: createdDepartments.find(d => d.nombre === 'COMPRAS').id
    },
    // Puestos para RH
    {
      nombre: 'Gerente de RH',
      descripcion: 'Responsable del departamento de Recursos Humanos',
      nivelJerarquico: 'GERENTE',
      departamentoId: createdDepartments.find(d => d.nombre === 'RH').id
    },
    // Puestos para Administración
    {
      nombre: 'Director General',
      descripcion: 'Máximo responsable de la empresa',
      nivelJerarquico: 'DIRECTOR',
      departamentoId: createdDepartments.find(d => d.nombre === 'Administración').id
    },
    // Puestos para Producción
    {
      nombre: 'Jefe de Producción',
      descripcion: 'Responsable del departamento de Producción',
      nivelJerarquico: 'GERENTE',
      departamentoId: createdDepartments.find(d => d.nombre === 'PRODUCCION').id
    }
  ];

  const createdJobPositions = [];
  for (const positionData of jobPositions) {
    const jobPosition = await prisma.jobPosition.create({
      data: positionData
    });
    createdJobPositions.push(jobPosition);
  }

  console.log('✅ Puestos de trabajo creados');

  // Crear empleados asociados a usuarios (con nuevos campos requeridos)
  const employees = [
    {
      nombre: 'Carlos López',
      rfc: 'LOPC830101ABC',
      curp: 'LOPC830101HDFLPR01',
      nss: '12345678901',
      fechaAlta: new Date('2023-01-15'),
      estatus: 'Activo',
      puestoId: createdJobPositions.find(p => p.nombre === 'Jefe de Sistemas').id,
      departamento_id: createdDepartments.find(d => d.nombre === 'SISTEMAS').id,
      userId: createdUsers.find(u => u.email === 'sistemas@kram.com').id,
      salarioMensual: 45000
    },
    {
      nombre: 'Ana Martínez',
      rfc: 'MARA830202DEF',
      curp: 'MARA830202MDFNTR02',
      nss: '12345678902',
      fechaAlta: new Date('2023-02-20'),
      estatus: 'Activo',
      puestoId: createdJobPositions.find(p => p.nombre === 'Jefe de Compras').id,
      departamento_id: createdDepartments.find(d => d.nombre === 'COMPRAS').id,
      userId: createdUsers.find(u => u.email === 'compras@kram.com').id,
      salarioMensual: 42000
    },
    {
      nombre: 'Roberto Sánchez',
      rfc: 'SANR830303GHI',
      curp: 'SANR830303HDFSNR03',
      nss: '12345678903',
      fechaAlta: new Date('2023-03-10'),
      estatus: 'Activo',
      puestoId: createdJobPositions.find(p => p.nombre === 'Desarrollador Senior').id,
      departamento_id: createdDepartments.find(d => d.nombre === 'SISTEMAS').id,
      userId: createdUsers.find(u => u.email === 'sistemas2@kram.com').id,
      salarioMensual: 38000
    },
    {
      nombre: 'Laura González',
      rfc: 'GONL830404JKL',
      curp: 'GONL830404MDFGNR04',
      nss: '12345678904',
      fechaAlta: new Date('2023-04-05'),
      estatus: 'Activo',
      puestoId: createdJobPositions.find(p => p.nombre === 'Analista de Compras').id,
      departamento_id: createdDepartments.find(d => d.nombre === 'COMPRAS').id,
      userId: createdUsers.find(u => u.email === 'compras2@kram.com').id,
      salarioMensual: 35000
    },
    {
      nombre: 'María Rodríguez',
      rfc: 'RODM830505MNO',
      curp: 'RODM830505MDFRDR05',
      nss: '12345678905',
      fechaAlta: new Date('2022-06-15'),
      estatus: 'Activo',
      puestoId: createdJobPositions.find(p => p.nombre === 'Gerente de RH').id,
      departamento_id: createdDepartments.find(d => d.nombre === 'RH').id,
      userId: createdUsers.find(u => u.email === 'rh@kram.com').id,
      salarioMensual: 48000
    },
    {
      nombre: 'Administrador Principal',
      rfc: 'ADMA830606PQR',
      curp: 'ADMA830606HDFDMR06',
      nss: '12345678906',
      fechaAlta: new Date('2022-01-10'),
      estatus: 'Activo',
      puestoId: createdJobPositions.find(p => p.nombre === 'Director General').id,
      departamento_id: createdDepartments.find(d => d.nombre === 'Administración').id,
      userId: createdUsers.find(u => u.email === 'admin@kram.com').id,
      salarioMensual: 55000
    },
    {
      nombre: 'Pedro Hernández',
      rfc: 'HERP830707STU',
      curp: 'HERP830707HDFHRD07',
      nss: '12345678907',
      fechaAlta: new Date('2023-05-15'),
      estatus: 'Activo',
      puestoId: createdJobPositions.find(p => p.nombre === 'Jefe de Producción').id,
      departamento_id: createdDepartments.find(d => d.nombre === 'PRODUCCION').id,
      userId: createdUsers.find(u => u.email === 'produccion@kram.com').id,
      salarioMensual: 46000
    }
  ];

  const createdEmployees = [];
  for (const employeeData of employees) {
    const employee = await prisma.employee.create({
      data: employeeData
    });
    createdEmployees.push(employee);
  }

  console.log('✅ Empleados creados');

  // Crear vacantes de ejemplo (usando el nuevo esquema)
  const vacancies = [
    {
      titulo: 'Desarrollador Full Stack',
      departamento_id: createdDepartments.find(d => d.nombre === 'SISTEMAS').id,
      jobPositionId: createdJobPositions.find(p => p.nombre === 'Desarrollador Senior').id,
      solicitanteId: createdEmployees[0].id, // Carlos López (Jefe de Sistemas)
      reportaA: 'Director de Sistemas',
      numeroVacantes: 1,
      motivoSolicitud: 'NUEVA_CREACION',
      tipoContratacion: 'ADMINISTRATIVO',
      entrevistadorTecnico: 'Carlos López',
      requerimientos_tecnicos: ['3+ años de experiencia en desarrollo web', 'Conocimiento en Node.js y React', 'Experiencia con bases de datos SQL/NoSQL', 'Inglés intermedio'],
      estatus: 'Aprobada',
      fechaAutorizacion: new Date('2024-01-10'),
      autorizadoPorId: createdEmployees[0].id, // Carlos López (Jefe de Sistemas)
      createdAt: new Date('2024-01-05')
    },
    {
      titulo: 'Analista de Compras',
      departamento_id: createdDepartments.find(d => d.nombre === 'COMPRAS').id,
      jobPositionId: createdJobPositions.find(p => p.nombre === 'Analista de Compras').id,
      solicitanteId: createdEmployees[1].id, // Ana Martínez (Jefe de Compras)
      reportaA: 'Director de Compras',
      numeroVacantes: 1,
      motivoSolicitud: 'NUEVA_CREACION',
      tipoContratacion: 'ADMINISTRATIVO',
      entrevistadorTecnico: 'Ana Martínez',
      requerimientos_tecnicos: ['Licenciatura en Administración o afín', '2+ años de experiencia en compras', 'Conocimiento en procesos de licitación', 'Excel avanzado'],
      estatus: 'Buscando',
      fechaAutorizacion: new Date('2024-01-15'),
      autorizadoPorId: createdEmployees[1].id, // Ana Martínez (Jefe de Compras)
      createdAt: new Date('2024-01-12')
    },
    {
      titulo: 'Especialista en Soporte Técnico',
      departamento_id: createdDepartments.find(d => d.nombre === 'SISTEMAS').id,
      jobPositionId: createdJobPositions.find(p => p.nombre === 'Especialista en Soporte Técnico').id,
      solicitanteId: createdEmployees[0].id, // Carlos López (Jefe de Sistemas)
      reportaA: 'Director de Sistemas',
      numeroVacantes: 1,
      motivoSolicitud: 'NUEVA_CREACION',
      tipoContratacion: 'ADMINISTRATIVO',
      entrevistadorTecnico: 'Carlos López',
      requerimientos_tecnicos: ['Certificación en redes o soporte técnico', 'Experiencia en help desk', 'Conocimiento de Windows/Linux', 'Habilidades de comunicación'],
      estatus: 'Solicitada',
      createdAt: new Date('2024-01-20')
    },
    {
      titulo: 'Coordinador de Logística',
      departamento_id: createdDepartments.find(d => d.nombre === 'COMPRAS').id,
      jobPositionId: createdJobPositions.find(p => p.nombre === 'Coordinador de Logística').id,
      solicitanteId: createdEmployees[1].id, // Ana Martínez (Jefe de Compras)
      reportaA: 'Director de Compras',
      numeroVacantes: 1,
      motivoSolicitud: 'NUEVA_CREACION',
      tipoContratacion: 'ADMINISTRATIVO',
      entrevistadorTecnico: 'Ana Martínez',
      requerimientos_tecnicos: ['Experiencia en logística', 'Conocimiento de sistemas de gestión', 'Habilidades de liderazgo', 'Disponibilidad para viajar'],
      estatus: 'Cerrada',
      fechaAutorizacion: new Date('2023-12-10'),
      autorizadoPorId: createdEmployees[1].id, // Ana Martínez (Jefe de Compras)
      closedAt: new Date('2024-01-05'),
      createdAt: new Date('2023-11-25')
    }
  ];

  const createdVacancies = [];
  for (const vacancyData of vacancies) {
    const vacancy = await prisma.jobVacancy.create({
      data: vacancyData
    });
    createdVacancies.push(vacancy);
  }

  console.log('✅ Vacantes creadas');

  // Crear actividades para las vacantes
  const activities = [
    {
      vacancyId: createdVacancies[0].id,
      activityType: 'Entrevista técnica',
      description: 'Evaluación de conocimientos técnicos en Node.js, React y bases de datos',
      duration: '1.5 horas',
      priority: 3,
      isCompleted: true,
      completedAt: new Date('2024-01-12')
    },
    {
      vacancyId: createdVacancies[0].id,
      activityType: 'Prueba práctica',
      description: 'Desarrollo de una pequeña aplicación para evaluar habilidades prácticas',
      duration: '3 horas',
      priority: 2,
      isCompleted: false
    },
    {
      vacancyId: createdVacancies[1].id,
      activityType: 'Entrevista con RH',
      description: 'Evaluación de habilidades blandas y cultural fit',
      duration: '1 hora',
      priority: 2,
      isCompleted: true,
      completedAt: new Date('2024-01-18')
    },
    {
      vacancyId: createdVacancies[1].id,
      activityType: 'Prueba de conocimientos',
      description: 'Evaluación de conocimientos en procesos de compra y Excel',
      duration: '2 horas',
      priority: 3,
      isCompleted: false
    }
  ];

  for (const activityData of activities) {
    await prisma.jobActivity.create({
      data: activityData
    });
  }

  console.log('✅ Actividades creadas');

  // Crear comentarios para las vacantes existentes
  const comments = [
    {
      vacancy_id: createdVacancies[0].id,
      user_id: createdUsers.find(u => u.email === 'sistemas@kram.com').id,
      mensaje: 'Necesitamos este perfil urgentemente para el proyecto de migración a microservicios.',
      createdAt: new Date('2024-01-29')
    },
    {
      vacancy_id: createdVacancies[0].id,
      user_id: createdUsers.find(u => u.email === 'rh@kram.com').id,
      mensaje: 'Entendido, ya aprobé la vacante. ¿Podrías definir el perfil técnico detallado?',
      createdAt: new Date('2024-01-30')
    },
    {
      vacancy_id: createdVacancies[1].id,
      user_id: createdUsers.find(u => u.email === 'compras@kram.com').id,
      mensaje: 'Esta posición es clave para nuestras operaciones internacionales.',
      createdAt: new Date('2024-02-02')
    },
    {
      vacancy_id: createdVacancies[1].id,
      user_id: createdUsers.find(u => u.email === 'rh@kram.com').id,
      mensaje: 'Aprobada. Ya estamos buscando candidatos con el perfil solicitado.',
      createdAt: new Date('2024-02-06')
    }
  ];

  for (const commentData of comments) {
    await prisma.vacancyComment.create({
      data: commentData
    });
  }

  console.log('✅ Comentarios creados');

  // Crear candidatos RH para las vacantes existentes
  const candidatesRH = [
    {
      vacancy_id: createdVacancies[0].id,
      nombre: 'Luis Fernández',
      cv_url: 'https://example.com/cv/luis-fernandez.pdf',
      estatus: 'En_Revision',
      comentarios_rh: 'Excelente experiencia en microservicios'
    },
    {
      vacancy_id: createdVacancies[0].id,
      nombre: 'Sofía Ramírez',
      cv_url: 'https://example.com/cv/sofia-ramirez.pdf',
      estatus: 'En_Revision',
      comentarios_rh: 'CV muy completo, programar entrevista'
    },
    {
      vacancy_id: createdVacancies[1].id,
      nombre: 'Miguel Torres',
      cv_url: 'https://example.com/cv/miguel-torres.pdf',
      estatus: 'Descartado',
      comentarios_rh: 'No cumple con nivel de inglés requerido'
    },
    {
      vacancy_id: createdVacancies[1].id,
      nombre: 'Elena Castro',
      cv_url: 'https://example.com/cv/elena-castro.pdf',
      estatus: 'Seleccionado',
      comentarios_rh: 'Excelente candidata, contratada'
    }
  ];

  for (const candidateData of candidatesRH) {
    await prisma.candidateRH.create({
      data: candidateData
    });
  }

  console.log('✅ Candidatos RH creados');

  console.log('🎉 Seed completado exitosamente!');
  console.log('📊 Resumen:');
  console.log(`   - ${roles.length} roles creados`);
  console.log(`   - ${users.length} usuarios creados`);
  console.log(`   - ${departments.length} departamentos creados`);
  console.log(`   - ${jobPositions.length} puestos de trabajo creados`);
  console.log(`   - ${employees.length} empleados creados`);
  console.log(`   - ${vacancies.length} vacantes creadas`);
  console.log(`   - ${activities.length} actividades creadas`);
  console.log(`   - ${comments.length} comentarios creados`);
  console.log(`   - ${candidatesRH.length} candidatos RH creados`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });