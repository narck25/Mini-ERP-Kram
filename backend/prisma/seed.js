const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (incluyendo nuevos modelos)
  await prisma.session.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobActivity.deleteMany();
  await prisma.jobVacancy.deleteMany();
  await prisma.candidateRH.deleteMany();
  await prisma.vacancyComment.deleteMany();
  await prisma.jobVacancyRH.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Datos anteriores eliminados');

  // Crear roles
  const roles = [
    { name: 'ADMIN', description: 'Administrador del sistema', permissions: ['*'] },
    { name: 'RH', description: 'Recursos Humanos', permissions: ['users.read', 'users.write', 'vacancies.*'] },
    { name: 'SISTEMAS', description: 'Departamento de Sistemas', permissions: ['system.*', 'vacancies.create'] },
    { name: 'COMPRAS', description: 'Departamento de Compras', permissions: ['purchases.*', 'vacancies.create'] }
  ];

  for (const roleData of roles) {
    await prisma.role.create({
      data: roleData
    });
  }

  console.log('✅ Roles creados');

  // Crear usuarios
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@kram.com',
      password: hashedPassword,
      name: 'Administrador Principal',
      role: 'ADMIN',
      isActive: true
    },
    {
      email: 'rh@kram.com',
      password: hashedPassword,
      name: 'María Rodríguez',
      role: 'RH',
      isActive: true
    },
    {
      email: 'sistemas@kram.com',
      password: hashedPassword,
      name: 'Carlos López',
      role: 'SISTEMAS',
      isActive: true
    },
    {
      email: 'compras@kram.com',
      password: hashedPassword,
      name: 'Ana Martínez',
      role: 'COMPRAS',
      isActive: true
    },
    {
      email: 'sistemas2@kram.com',
      password: hashedPassword,
      name: 'Roberto Sánchez',
      role: 'SISTEMAS',
      isActive: true
    },
    {
      email: 'compras2@kram.com',
      password: hashedPassword,
      name: 'Laura González',
      role: 'COMPRAS',
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
      nombre: 'Sistemas',
      descripcion: 'Departamento de Tecnologías de la Información'
    },
    {
      nombre: 'Compras',
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

  // Crear empleados asociados a usuarios (con nuevos campos requeridos)
  const employees = [
    {
      nombre: 'Carlos López',
      rfc: 'LOPC830101ABC',
      curp: 'LOPC830101HDFLPR01',
      nss: '12345678901',
      fecha_ingreso: new Date('2023-01-15'),
      estatus: 'Activo',
      puesto: 'Jefe de Sistemas',
      departamento_id: createdDepartments.find(d => d.nombre === 'Sistemas').id,
      userId: createdUsers.find(u => u.email === 'sistemas@kram.com').id,
      salary: 45000
    },
    {
      nombre: 'Ana Martínez',
      rfc: 'MARA830202DEF',
      curp: 'MARA830202MDFNTR02',
      nss: '12345678902',
      fecha_ingreso: new Date('2023-02-20'),
      estatus: 'Activo',
      puesto: 'Jefe de Compras',
      departamento_id: createdDepartments.find(d => d.nombre === 'Compras').id,
      userId: createdUsers.find(u => u.email === 'compras@kram.com').id,
      salary: 42000
    },
    {
      nombre: 'Roberto Sánchez',
      rfc: 'SANR830303GHI',
      curp: 'SANR830303HDFSNR03',
      nss: '12345678903',
      fecha_ingreso: new Date('2023-03-10'),
      estatus: 'Activo',
      puesto: 'Desarrollador Senior',
      departamento_id: createdDepartments.find(d => d.nombre === 'Sistemas').id,
      userId: createdUsers.find(u => u.email === 'sistemas2@kram.com').id,
      salary: 38000
    },
    {
      nombre: 'Laura González',
      rfc: 'GONL830404JKL',
      curp: 'GONL830404MDFGNR04',
      nss: '12345678904',
      fecha_ingreso: new Date('2023-04-05'),
      estatus: 'Activo',
      puesto: 'Analista de Compras',
      departamento_id: createdDepartments.find(d => d.nombre === 'Compras').id,
      userId: createdUsers.find(u => u.email === 'compras2@kram.com').id,
      salary: 35000
    },
    {
      nombre: 'María Rodríguez',
      rfc: 'RODM830505MNO',
      curp: 'RODM830505MDFRDR05',
      nss: '12345678905',
      fecha_ingreso: new Date('2022-06-15'),
      estatus: 'Activo',
      puesto: 'Gerente de RH',
      departamento_id: createdDepartments.find(d => d.nombre === 'RH').id,
      userId: createdUsers.find(u => u.email === 'rh@kram.com').id,
      salary: 48000
    },
    {
      nombre: 'Administrador Principal',
      rfc: 'ADMA830606PQR',
      curp: 'ADMA830606HDFDMR06',
      nss: '12345678906',
      fecha_ingreso: new Date('2022-01-10'),
      estatus: 'Activo',
      puesto: 'Director General',
      departamento_id: createdDepartments.find(d => d.nombre === 'Administración').id,
      userId: createdUsers.find(u => u.email === 'admin@kram.com').id,
      salary: 55000
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

  // Crear vacantes de ejemplo
  const vacancies = [
    {
      title: 'Desarrollador Full Stack',
      description: 'Buscamos desarrollador con experiencia en Node.js, React y bases de datos. Responsable de desarrollar y mantener aplicaciones web.',
      department: 'Sistemas',
      position: 'Desarrollador',
      salaryRange: '$35,000 - $45,000',
      requirements: ['3+ años de experiencia en desarrollo web', 'Conocimiento en Node.js y React', 'Experiencia con bases de datos SQL/NoSQL', 'Inglés intermedio'],
      responsibilities: ['Desarrollo de nuevas funcionalidades', 'Mantenimiento de aplicaciones existentes', 'Colaboración con equipo de diseño', 'Participación en code reviews'],
      status: 'APROBADA',
      createdById: createdEmployees.find(e => e.puesto === 'Jefe de Sistemas').id,
      approvedById: createdUsers.find(u => u.email === 'rh@kram.com').id,
      approvedAt: new Date('2024-01-10'),
      createdAt: new Date('2024-01-05')
    },
    {
      title: 'Analista de Compras',
      description: 'Se requiere analista para gestionar procesos de compra, negociación con proveedores y control de inventarios.',
      department: 'Compras',
      position: 'Analista',
      salaryRange: '$30,000 - $38,000',
      requirements: ['Licenciatura en Administración o afín', '2+ años de experiencia en compras', 'Conocimiento en procesos de licitación', 'Excel avanzado'],
      responsibilities: ['Gestión de proveedores', 'Negociación de precios', 'Control de inventarios', 'Elaboración de reportes'],
      status: 'BUSCANDO',
      createdById: createdEmployees.find(e => e.puesto === 'Jefe de Compras').id,
      approvedById: createdUsers.find(u => u.email === 'rh@kram.com').id,
      approvedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-12')
    },
    {
      title: 'Especialista en Soporte Técnico',
      description: 'Vacante para especialista en soporte técnico nivel 2, con experiencia en resolución de incidencias y atención a usuarios.',
      department: 'Sistemas',
      position: 'Especialista',
      salaryRange: '$28,000 - $35,000',
      requirements: ['Certificación en redes o soporte técnico', 'Experiencia en help desk', 'Conocimiento de Windows/Linux', 'Habilidades de comunicación'],
      responsibilities: ['Atención a tickets de soporte', 'Resolución de incidencias', 'Mantenimiento preventivo', 'Capacitación a usuarios'],
      status: 'PENDIENTE',
      createdById: createdEmployees.find(e => e.puesto === 'Jefe de Sistemas').id,
      createdAt: new Date('2024-01-20')
    },
    {
      title: 'Coordinador de Logística',
      description: 'Coordinador para gestionar procesos logísticos, distribución y optimización de rutas de entrega.',
      department: 'Compras',
      position: 'Coordinador',
      salaryRange: '$32,000 - $40,000',
      requirements: ['Experiencia en logística', 'Conocimiento de sistemas de gestión', 'Habilidades de liderazgo', 'Disponibilidad para viajar'],
      responsibilities: ['Planificación de rutas', 'Coordinación de entregas', 'Gestión de flota', 'Optimización de procesos'],
      status: 'CERRADA',
      createdById: createdEmployees.find(e => e.puesto === 'Jefe de Compras').id,
      approvedById: createdUsers.find(u => u.email === 'rh@kram.com').id,
      approvedAt: new Date('2023-12-10'),
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

  // Crear candidatos para las vacantes
  const candidates = [
    {
      vacancyId: createdVacancies[0].id,
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      phone: '555-123-4567',
      resumeUrl: 'https://example.com/cv/juan-perez.pdf',
      status: 'EN_PROCESO',
      notes: 'Buen desempeño en entrevista técnica',
      interviewDate: new Date('2024-01-25')
    },
    {
      vacancyId: createdVacancies[0].id,
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@example.com',
      phone: '555-987-6543',
      resumeUrl: 'https://example.com/cv/maria-garcia.pdf',
      status: 'PENDIENTE',
      notes: 'CV muy interesante, programar entrevista'
    },
    {
      vacancyId: createdVacancies[1].id,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@example.com',
      phone: '555-456-7890',
      resumeUrl: 'https://example.com/cv/carlos-rodriguez.pdf',
      status: 'RECHAZADO',
      notes: 'No cumple con experiencia requerida'
    },
    {
      vacancyId: createdVacancies[1].id,
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@example.com',
      phone: '555-789-0123',
      resumeUrl: 'https://example.com/cv/ana-martinez.pdf',
      status: 'CONTRATADO',
      notes: 'Excelente candidata, contratada',
      interviewDate: new Date('2024-01-20')
    }
  ];

  for (const candidateData of candidates) {
    await prisma.candidate.create({
      data: candidateData
    });
  }

  console.log('✅ Candidatos creados');

  console.log('🎉 Seed completado exitosamente!');
  console.log('📊 Resumen:');
  console.log(`   - ${roles.length} roles creados`);
  console.log(`   - ${users.length} usuarios creados`);
  console.log(`   - ${employees.length} empleados creados`);
  console.log(`   - ${vacancies.length} vacantes creadas`);
  console.log(`   - ${activities.length} actividades creadas`);
  console.log(`   - ${candidates.length} candidatos creados`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });