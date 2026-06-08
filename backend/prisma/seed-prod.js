const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🏭 Iniciando seed de PRODUCCIÓN (idempotente)...');
  console.log('');

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
          'VACACIONES', 'INCIDENCIAS', 'CONFIGURACION', 'REPORTES'
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
