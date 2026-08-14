const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Activar reset con --reset (CLI) o con variable de entorno SEED_RESET=true
  const shouldReset = process.argv.includes('--reset') || process.env.SEED_RESET === 'true';
  
  console.log('🏭 Iniciando seed de PRODUCCIÓN (idempotente)...');
  console.log('');

  // ============================================================
  // PASO 0: Resetear base de datos (si se pasa --reset)
  // ============================================================
  if (shouldReset) {
    console.log('⚠️  ═══════════════════════════════════════════');
    console.log('⚠️  RESETEANDO BASE DE DATOS COMPLETAMENTE');
    console.log('⚠️  ═══════════════════════════════════════════');
    console.log('');
    
    // Eliminar en orden inverso de dependencias
    console.log('🗑️  Eliminando datos existentes...');
    
    // Tablas con dependencias (hijas primero)
    await prisma.notificationLog.deleteMany();
    console.log('   ✅ NotificationLog eliminados');
    await prisma.vacancyComment.deleteMany();
    console.log('   ✅ Comentarios de vacantes eliminados');
    await prisma.jobActivity.deleteMany();
    console.log('   ✅ Actividades de vacantes eliminadas');
    await prisma.candidateRH.deleteMany();
    console.log('   ✅ Candidatos eliminados');
    await prisma.jobVacancy.deleteMany();
    console.log('   ✅ Vacantes eliminadas');
    await prisma.purchaseQuote.deleteMany();
    console.log('   ✅ Cotizaciones eliminadas');
    await prisma.purchaseItem.deleteMany();
    console.log('   ✅ Items de compra eliminados');
    await prisma.purchaseRequest.deleteMany();
    console.log('   ✅ Solicitudes de compra eliminadas');
    await prisma.attendanceRecord.deleteMany();
    console.log('   ✅ Asistencias eliminadas');
    await prisma.salaryHistory.deleteMany();
    console.log('   ✅ Historial de sueldos eliminado');
    await prisma.employeeDocument.deleteMany();
    console.log('   ✅ Documentos eliminados');
    await prisma.employee.deleteMany();
    console.log('   ✅ Empleados eliminados');
    await prisma.jobPosition.deleteMany();
    console.log('   ✅ Puestos eliminados');
    await prisma.department.deleteMany();
    console.log('   ✅ Departamentos eliminados');
    await prisma.session.deleteMany();
    console.log('   ✅ Sesiones eliminadas');
    await prisma.user.deleteMany();
    console.log('   ✅ Usuarios eliminados');
    await prisma.role.deleteMany();
    console.log('   ✅ Roles eliminados');
    
    console.log('');
    console.log('✅ Base de datos limpiada completamente');
    console.log('');
  }

  // ============================================================
  // PASO 1: Crear roles del sistema (si no existen)
  // ============================================================
  console.log('📋 Verificando roles del sistema...');
  const roles = [
    { name: 'ADMIN', description: 'Administrador del sistema', color: 'bg-purple-100 text-purple-800', icon: '👑', isCustom: false },
    { name: 'RH', description: 'Recursos Humanos', color: 'bg-blue-100 text-blue-800', icon: '👥', isCustom: false },
    { name: 'SISTEMAS', description: 'Departamento de Sistemas', color: 'bg-green-100 text-green-800', icon: '💻', isCustom: false },
    { name: 'COMPRAS', description: 'Departamento de Compras', color: 'bg-yellow-100 text-yellow-800', icon: '🛒', isCustom: false },
    { name: 'PRODUCCION', description: 'Departamento de Producción', color: 'bg-red-100 text-red-800', icon: '🏭', isCustom: false },
    { name: 'EMPLEADO_BASICO', description: 'Empleado sin permisos administrativos', color: 'bg-gray-100 text-gray-800', icon: '👤', isCustom: false }
  ];

  for (const roleData of roles) {
    try {
      const existing = await prisma.role.findUnique({ where: { name: roleData.name } });
      if (!existing) {
        await prisma.role.create({ data: roleData });
        console.log(`   ✅ Rol creado: ${roleData.name}`);
      } else {
        console.log(`   ⏭️  Rol ya existe: ${roleData.name}`);
      }
    } catch (err) {
      // Si falla con P2032 (incompatibilidad de tipos), intentar con SQL directo
      if (err.code === 'P2032') {
        console.log(`   ⚠️  Error con Prisma ORM para ${roleData.name}, intentando con SQL directo...`);
        await prisma.$executeRawUnsafe(
          `INSERT INTO roles (name, description, color, icon, "isCustom") VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING`,
          roleData.name, roleData.description, roleData.color, roleData.icon, roleData.isCustom
        );
        console.log(`   ✅ Rol creado (SQL directo): ${roleData.name}`);
      } else {
        throw err;
      }
    }
  }
  console.log('✅ Roles verificados');
  console.log('');

  // ============================================================
  // PASO 2: Crear solo el Administrador Principal (si no existe)
  // ============================================================
  console.log('👤 Verificando Administrador Principal...');
  
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@kram.com' } });
  
  if (existingAdmin) {
    console.log(`⏭️  Administrador ya existe: ${existingAdmin.email}`);
  } else {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@kram.com',
        password: hashedPassword,
        name: 'Administrador Principal',
        role: 'ADMIN',
        accessibleModules: [
          'DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO', 
          'INCIDENCIAS', 'CONFIGURACION'
        ],
        isActive: true
      }
    });
    console.log(`✅ Administrador creado: ${adminUser.email}`);
  }
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
