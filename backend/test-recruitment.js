/**
 * TEST DE INTEGRACIÓN: Controlador de Reclutamiento (Vacantes)
 * 
 * Prueba las funciones clave del recruitment.controller.js:
 * - createVacancy (flujo estándar y directo)
 * - getVacancyRequestById
 * - createJobActivities
 * - updateActivity
 * - approveVacancyRequest
 * - getAllVacancyRequests
 * - getMyVacancyRequests
 * 
 * Uso: node test-recruitment.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

let passed = 0;
let failed = 0;
let testVacancyId = null;
let testActivityId = null;
let testUsers = {};
let testEmployees = {};

function assert(condition, message) {
  if (condition) {
    console.log(`  ${colors.green}✓${colors.reset} ${message}`);
    passed++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${message}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${colors.cyan}${colors.bold}━━━ ${title} ━━━${colors.reset}\n`);
}

async function cleanup() {
  try {
    if (testVacancyId) {
      await prisma.jobActivity.deleteMany({ where: { vacancyId: testVacancyId } });
      await prisma.vacancyComment.deleteMany({ where: { vacancy_id: testVacancyId } });
      await prisma.candidateRH.deleteMany({ where: { vacancy_id: testVacancyId } });
      await prisma.jobVacancy.delete({ where: { id: testVacancyId } });
    }
    // Limpiar empleados de prueba
    for (const key of Object.keys(testEmployees)) {
      if (testEmployees[key]) {
        await prisma.employee.delete({ where: { id: testEmployees[key] } }).catch(() => {});
      }
    }
    // Limpiar usuarios de prueba
    for (const key of Object.keys(testUsers)) {
      if (testUsers[key]) {
        await prisma.user.delete({ where: { id: testUsers[key] } }).catch(() => {});
      }
    }
  } catch (e) {
    // Ignorar errores de limpieza
  }
}

async function runTests() {
  console.log(`${colors.bold}${colors.blue}╔══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║   TEST: Controlador de Reclutamiento (Vacantes) ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}╚══════════════════════════════════════════════╝${colors.reset}`);

  try {
    // ============================================================
    // PRERREQUISITOS: Obtener datos de la BD y crear usuarios
    // ============================================================
    section('PRERREQUISITOS');

    // Obtener un departamento existente
    const department = await prisma.department.findFirst();
    assert(department !== null, 'Debe existir al menos un departamento en la BD');
    if (!department) {
      console.log(`  ${colors.red}No hay departamentos. Ejecuta el seed primero.${colors.reset}`);
      process.exit(1);
    }
    console.log(`  Departamento: ${department.nombre} (${department.id})`);

    // Obtener departamento RH
    const rhDepartment = await prisma.department.findFirst({
      where: { nombre: { in: ['RH', 'RECURSOS HUMANOS'] } }
    });
    assert(rhDepartment !== null, 'Debe existir departamento RH o RECURSOS HUMANOS');
    console.log(`  Depto RH: ${rhDepartment.nombre} (${rhDepartment.id})`);

    // Obtener un puesto existente
    const jobPosition = await prisma.jobPosition.findFirst();
    assert(jobPosition !== null, 'Debe existir al menos un puesto en la BD');
    if (jobPosition) {
      console.log(`  Puesto: ${jobPosition.nombre} (${jobPosition.id})`);
    }

    // Crear usuarios de prueba en la BD
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('test123', 10);

    const sistemasUser = await prisma.user.create({
      data: {
        id: 'test-sis-' + Date.now(),
        name: 'Test Sistemas',
        email: 'test.sistemas@test.com',
        password: hashedPassword,
        role: 'SISTEMAS',
        accessibleModules: ['RECLUTAMIENTO', 'EMPLEADOS']
      }
    });
    testUsers.sistemas = sistemasUser.id;
    console.log(`  Usuario SISTEMAS creado: ${sistemasUser.id}`);

    const rhUser = await prisma.user.create({
      data: {
        id: 'test-rh-' + Date.now(),
        name: 'Test RH',
        email: 'test.rh@test.com',
        password: hashedPassword,
        role: 'RH',
        accessibleModules: ['RECLUTAMIENTO', 'EMPLEADOS', 'VACACIONES']
      }
    });
    testUsers.rh = rhUser.id;
    console.log(`  Usuario RH creado: ${rhUser.id}`);

    // Crear empleado de RH
    const rhEmployee = await prisma.employee.create({
      data: {
        nombre: 'Test RH Employee',
        rfc: 'TRH000000001',
        curp: 'TRH0000000000001',
        nss: '00000000002',
        fechaAlta: new Date(),
        estatus: 'Activo',
        departamento_id: rhDepartment.id,
        userId: rhUser.id
      }
    });
    testEmployees.rh = rhEmployee.id;
    console.log(`  Empleado RH creado: ${rhEmployee.id}`);

    // Crear empleado de SISTEMAS
    const sistemasEmployee = await prisma.employee.create({
      data: {
        nombre: 'Test Sistemas Employee',
        rfc: 'TSE000000001',
        curp: 'TSE0000000000001',
        nss: '00000000001',
        fechaAlta: new Date(),
        estatus: 'Activo',
        departamento_id: department.id,
        userId: sistemasUser.id
      }
    });
    testEmployees.sistemas = sistemasEmployee.id;
    console.log(`  Empleado SISTEMAS creado: ${sistemasEmployee.id}`);

    // ============================================================
    // TEST 1: createVacancy - Flujo Estándar (SISTEMAS)
    // ============================================================
    section('TEST 1: createVacancy - Flujo Estándar (SISTEMAS)');

    const recruitmentController = require('./src/controllers/recruitment.controller');

    const req1 = {
      user: { id: sistemasUser.id, name: sistemasUser.name, email: sistemasUser.email, role: sistemasUser.role, accessibleModules: sistemasUser.accessibleModules },
      body: {
        titulo: 'TEST - Desarrollador Full Stack',
        departamento_id: department.id,
        jobPositionId: jobPosition?.id || null,
        numeroVacantes: 1,
        motivoSolicitud: 'NUEVA_CREACION',
        tipoContratacion: 'ADMINISTRATIVO',
        consideraPromocionInterna: false,
        reqComputadoraEscritorio: true,
        reqLaptop: false,
        ubicacionFisica: 'Oficina Central'
      }
    };

    const res1 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.createVacancy(req1, res1);
    
    assert(res1.statusCode === 201, `createVacancy (estándar) debe retornar 201, obtuvo ${res1.statusCode}`);
    assert(res1.body && res1.body.vacancy, 'Debe retornar la vacante creada');
    assert(res1.body.vacancy.estatus === 'Solicitada', 'La vacante estándar debe tener estatus "Solicitada"');
    
    testVacancyId = res1.body.vacancy.id;
    console.log(`  Vacante creada: ${testVacancyId}`);
    console.log(`  Título: ${res1.body.vacancy.titulo}`);
    console.log(`  Estatus: ${res1.body.vacancy.estatus}`);

    // ============================================================
    // TEST 2: createVacancy - Flujo Directo (RH)
    // ============================================================
    section('TEST 2: createVacancy - Flujo Directo (RH)');

    const req2 = {
      user: { id: rhUser.id, name: rhUser.name, email: rhUser.email, role: rhUser.role, accessibleModules: rhUser.accessibleModules, employeeId: rhEmployee.id },
      body: {
        titulo: 'TEST - Analista RH Directo',
        departamento_id: department.id,
        jobPositionId: jobPosition?.id || null,
        numeroVacantes: 1,
        motivoSolicitud: 'NUEVA_CREACION',
        tipoContratacion: 'ADMINISTRATIVO',
        isDirect: true,
        actividades: [
          {
            activityType: 'Entrevista inicial',
            description: 'Entrevista con RH para evaluar habilidades blandas',
            duration: '1 hora',
            priority: 2
          },
          {
            activityType: 'Prueba técnica',
            description: 'Evaluación de conocimientos técnicos',
            duration: '2 horas',
            priority: 3
          }
        ]
      }
    };

    const res2 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.createVacancy(req2, res2);
    
    assert(res2.statusCode === 201, `createVacancy (directo) debe retornar 201, obtuvo ${res2.statusCode}`);
    assert(res2.body && res2.body.vacancy, 'Debe retornar la vacante creada');
    assert(res2.body.vacancy.estatus === 'Aprobada', 'La vacante directa debe tener estatus "Aprobada"');
    assert(res2.body.isDirect === true, 'Debe indicar que es flujo directo');
    
    const directVacancyId = res2.body.vacancy.id;
    console.log(`  Vacante directa creada: ${directVacancyId}`);
    console.log(`  Estatus: ${res2.body.vacancy.estatus}`);

    // Verificar que se crearon las actividades
    const directActivities = await prisma.jobActivity.findMany({
      where: { vacancyId: directVacancyId }
    });
    assert(directActivities.length === 2, `Deben crearse 2 actividades, se crearon ${directActivities.length}`);
    console.log(`  Actividades creadas: ${directActivities.length}`);

    // Limpiar la vacante directa
    await prisma.jobActivity.deleteMany({ where: { vacancyId: directVacancyId } });
    await prisma.vacancyComment.deleteMany({ where: { vacancy_id: directVacancyId } });
    await prisma.jobVacancy.delete({ where: { id: directVacancyId } });

    // ============================================================
    // TEST 3: getVacancyRequestById
    // ============================================================
    section('TEST 3: getVacancyRequestById');

    const req3 = {
      params: { id: testVacancyId },
      user: { id: sistemasUser.id, name: sistemasUser.name, email: sistemasUser.email, role: sistemasUser.role },
      protocol: 'http',
      get(header) { return header === 'host' ? 'localhost:3001' : null; }
    };

    const res3 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.getVacancyRequestById(req3, res3);
    
    assert(res3.statusCode === null || res3.statusCode === undefined, 'getVacancyRequestById no debe retornar error');
    assert(res3.body && res3.body.vacancy, 'Debe retornar la vacante');
    assert(res3.body.vacancy.id === testVacancyId, 'Debe retornar la vacante correcta');
    assert(res3.body.vacancy.titulo === 'TEST - Desarrollador Full Stack', 'El título debe coincidir');
    console.log(`  Vacante encontrada: ${res3.body.vacancy.titulo}`);

    // ============================================================
    // TEST 4: createJobActivities
    // ============================================================
    section('TEST 4: createJobActivities');

    // Cambiar estatus a Aprobada para poder crear actividades
    await prisma.jobVacancy.update({
      where: { id: testVacancyId },
      data: { estatus: 'Aprobada', solicitanteId: sistemasEmployee.id }
    });

    const req4 = {
      params: { id: testVacancyId },
      user: { id: sistemasUser.id, name: sistemasUser.name, email: sistemasUser.email, role: sistemasUser.role },
      body: {
        actividades: [
          {
            activityType: 'Entrevista técnica',
            description: 'Evaluación de habilidades técnicas en React y Node.js',
            duration: '1.5 horas',
            priority: 3
          },
          {
            activityType: 'Prueba de código',
            description: 'Resolver un ejercicio práctico de programación',
            duration: '2 horas',
            priority: 2
          }
        ]
      }
    };

    const res4 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.createJobActivities(req4, res4);
    
    assert(res4.statusCode === null || res4.statusCode === undefined, 'createJobActivities no debe retornar error');
    assert(res4.body && res4.body.activities, 'Debe retornar las actividades creadas');
    assert(res4.body.activities.length === 2, `Deben crearse 2 actividades, se crearon ${res4.body.activities.length}`);
    
    testActivityId = res4.body.activities[0].id;
    console.log(`  Actividades creadas: ${res4.body.activities.length}`);
    console.log(`  Primera actividad: ${res4.body.activities[0].activityType}`);

    // ============================================================
    // TEST 5: updateActivity (marcar como completada)
    // ============================================================
    section('TEST 5: updateActivity (marcar como completada)');

    const req5 = {
      params: { activityId: testActivityId },
      user: { id: sistemasUser.id },
      body: { isCompleted: true }
    };

    const res5 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.updateActivity(req5, res5);
    
    assert(res5.statusCode === null || res5.statusCode === undefined, 'updateActivity no debe retornar error');
    assert(res5.body && res5.body.activity, 'Debe retornar la actividad actualizada');
    assert(res5.body.activity.isCompleted === true, 'La actividad debe estar marcada como completada');
    assert(res5.body.activity.completedAt !== null, 'Debe tener fecha de completado');
    console.log(`  Actividad "${res5.body.activity.activityType}" marcada como completada`);
    console.log(`  Completada en: ${res5.body.activity.completedAt}`);

    // ============================================================
    // TEST 6: updateActivity (desmarcar)
    // ============================================================
    section('TEST 6: updateActivity (desmarcar como completada)');

    const req6 = {
      params: { activityId: testActivityId },
      user: { id: sistemasUser.id },
      body: { isCompleted: false }
    };

    const res6 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.updateActivity(req6, res6);
    
    assert(res6.body.activity.isCompleted === false, 'La actividad debe estar desmarcada');
    assert(res6.body.activity.completedAt === null, 'La fecha de completado debe ser null');
    console.log(`  Actividad desmarcada correctamente`);

    // ============================================================
    // TEST 7: getAllVacancyRequests
    // ============================================================
    section('TEST 7: getAllVacancyRequests');

    const req7 = {
      user: { id: rhUser.id, role: rhUser.role },
      query: {}
    };

    const res7 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.getAllVacancyRequests(req7, res7);
    
    assert(res7.body && res7.body.vacancies, 'Debe retornar lista de vacantes');
    assert(Array.isArray(res7.body.vacancies), 'vacancies debe ser un array');
    assert(res7.body.pagination, 'Debe incluir paginación');
    console.log(`  Total de vacantes: ${res7.body.pagination.total}`);
    console.log(`  Página: ${res7.body.pagination.page}/${res7.body.pagination.totalPages}`);

    // ============================================================
    // TEST 8: getMyVacancyRequests
    // ============================================================
    section('TEST 8: getMyVacancyRequests');

    const req8 = {
      user: { id: sistemasUser.id },
      query: {}
    };

    const res8 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.getMyVacancyRequests(req8, res8);
    
    assert(res8.body && res8.body.vacancies, 'Debe retornar lista de vacantes del usuario');
    assert(Array.isArray(res8.body.vacancies), 'vacancies debe ser un array');
    console.log(`  Vacantes del usuario: ${res8.body.pagination?.total || res8.body.vacancies.length}`);

    // ============================================================
    // TEST 9: approveVacancyRequest
    // ============================================================
    section('TEST 9: approveVacancyRequest');

    // Resetear estatus a Solicitada
    await prisma.jobVacancy.update({
      where: { id: testVacancyId },
      data: { estatus: 'Solicitada' }
    });

    const req9 = {
      params: { id: testVacancyId },
      user: { id: rhUser.id, employeeId: rhEmployee.id },
      body: {}
    };

    const res9 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.approveVacancyRequest(req9, res9);
    
    assert(res9.statusCode === null || res9.statusCode === undefined, 'approveVacancyRequest no debe retornar error');
    assert(res9.body && res9.body.vacancy, 'Debe retornar la vacante aprobada');
    assert(res9.body.vacancy.estatus === 'Aprobada', 'La vacante debe tener estatus "Aprobada"');
    console.log(`  Vacante aprobada por RH`);
    console.log(`  Nuevo estatus: ${res9.body.vacancy.estatus}`);

    // ============================================================
    // TEST 10: Error handling - Vacante no encontrada
    // ============================================================
    section('TEST 10: Error handling - Vacante no encontrada');

    const req10 = {
      params: { id: 'non-existent-id' },
      user: { id: sistemasUser.id },
      protocol: 'http',
      get(header) { return header === 'host' ? 'localhost:3001' : null; }
    };

    const res10 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.getVacancyRequestById(req10, res10);
    
    assert(res10.statusCode === 404, `Debe retornar 404, obtuvo ${res10.statusCode}`);
    assert(res10.body && res10.body.error, 'Debe retornar mensaje de error');
    console.log(`  Error esperado: ${res10.body.error}`);

    // ============================================================
    // TEST 11: createVacancy - Departamento inválido
    // ============================================================
    section('TEST 11: createVacancy - Departamento inválido');

    const req11 = {
      user: { id: sistemasUser.id, role: sistemasUser.role },
      body: {
        titulo: 'TEST - Vacante sin departamento',
        departamento_id: 'non-existent-dept',
        numeroVacantes: 1
      }
    };

    const res11 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.createVacancy(req11, res11);
    
    assert(res11.statusCode === 404, `Debe retornar 404, obtuvo ${res11.statusCode}`);
    assert(res11.body && res11.body.error === 'Departamento no encontrado', 'Debe indicar que el departamento no existe');
    console.log(`  Error esperado: ${res11.body.error}`);

    // ============================================================
    // TEST 12: createJobActivities - Vacante no aprobada
    // ============================================================
    section('TEST 12: createJobActivities - Vacante no aprobada');

    // Cambiar estatus a Solicitada
    await prisma.jobVacancy.update({
      where: { id: testVacancyId },
      data: { estatus: 'Solicitada' }
    });

    const req12 = {
      params: { id: testVacancyId },
      user: { id: sistemasUser.id },
      body: {
        actividades: [{ activityType: 'Test', description: 'Test' }]
      }
    };

    const res12 = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; }
    };

    await recruitmentController.createJobActivities(req12, res12);
    
    assert(res12.statusCode === 400, `Debe retornar 400, obtuvo ${res12.statusCode}`);
    assert(res12.body && res12.body.error, 'Debe retornar mensaje de error');
    console.log(`  Error esperado: ${res12.body.error}`);

    // ============================================================
    // RESUMEN
    // ============================================================
    console.log(`\n${colors.bold}${colors.blue}══════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}   RESUMEN DE PRUEBAS${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}══════════════════════════════════════════════${colors.reset}`);
    console.log(`  ${colors.green}Pasadas: ${passed}${colors.reset}`);
    console.log(`  ${failed > 0 ? colors.red : ''}Falladas: ${failed}${colors.reset}`);
    console.log(`  Total: ${passed + failed}`);
    
    if (failed === 0) {
      console.log(`\n  ${colors.green}${colors.bold}✅ TODAS LAS PRUEBAS PASARON${colors.reset}\n`);
    } else {
      console.log(`\n  ${colors.red}${colors.bold}❌ ALGUNAS PRUEBAS FALLARON${colors.reset}\n`);
    }

  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}ERROR FATAL:${colors.reset}`, error);
    failed++;
  } finally {
    // Limpiar datos de prueba
    await cleanup();
    await prisma.$disconnect();
    
    // Salir con código de error si hay fallos
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
