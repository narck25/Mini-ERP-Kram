const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🏭 Iniciando seed de PRODUCCIÓN...');
  console.log('');

  // Limpiar datos existentes
  console.log('🧹 Limpiando datos anteriores...');
  await prisma.session.deleteMany();
  await prisma.jobActivity.deleteMany();
  await prisma.jobVacancy.deleteMany();
  await prisma.candidateRH.deleteMany();
  await prisma.vacancyComment.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.jobPosition.deleteMany();
  await prisma.department.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Datos anteriores eliminados');
  console.log('');

  // ============================================================
  // PASO 1: Crear roles del sistema
  // ============================================================
  console.log('📋 Creando roles del sistema...');
  const roles = [
    { name: 'ADMIN', description: 'Administrador del sistema', permissions: ['*'] },
    { name: 'RH', description: 'Recursos Humanos', permissions: ['users.read', 'users.write', 'vacancies.*'] },
    { name: 'SISTEMAS', description: 'Departamento de Sistemas', permissions: ['system.*', 'vacancies.create'] },
    { name: 'COMPRAS', description: 'Departamento de Compras', permissions: ['purchases.*', 'vacancies.create'] },
    { name: 'PRODUCCION', description: 'Departamento de Producción', permissions: ['production.*', 'vacancies.create'] },
    { name: 'EMPLEADO_BASICO', description: 'Empleado sin permisos administrativos', permissions: ['basic.access'] }
  ];

  for (const roleData of roles) {
    await prisma.role.create({ data: roleData });
  }
  console.log('✅ Roles creados');
  console.log('');

  // ============================================================
  // PASO 2: Crear solo el Administrador Principal
  // ============================================================
  console.log('👤 Creando Administrador Principal...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@kram.com',
      password: hashedPassword,
      name: 'Administrador Principal',
      role: 'ADMIN',
      accessibleModules: [
        'DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO', 
        'VACACIONES', 'INCIDENCIAS', 'CONFIGURACION', 'REPORTES'
      ],
      isActive: true
    }
  });
  console.log(`✅ Administrador creado: ${adminUser.email}`);
  console.log('');

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  console.log('═══════════════════════════════════════════');
  console.log('  🏭 SEED DE PRODUCCIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('📊 Resumen de datos creados:');
  console.log(`   • Roles: ${roles.length}`);
  console.log(`   • Usuarios: 1 (Administrador Principal)`);
  console.log(`   • Departamentos: 0 (se crean con el CSV)`);
  console.log(`   • Empleados: 0`);
  console.log(`   • Puestos: 0`);
  console.log(`   • Vacantes: 0`);
  console.log(`   • Compras: 0`);
  console.log('');
  console.log('🔑 Credenciales del Administrador:');
  console.log(`   • Email: admin@kram.com`);
  console.log(`   • Contraseña: password123`);
  console.log('');
  console.log('⚠️  IMPORTANTE: Cambia la contraseña del administrador');
  console.log('   después del primer inicio de sesión.');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed de producción:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
