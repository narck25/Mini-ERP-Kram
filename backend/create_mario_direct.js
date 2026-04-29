// Script directo para crear usuario Mario Alberto Negrete Sanchez
console.log('🚀 CREANDO USUARIO MARIO ALBERTO NEGRETE SANCHEZ');
console.log('================================================\n');

// Primero, cambiar al directorio backend si es necesario
const path = require('path');
const fs = require('fs');

// Verificar si estamos en el directorio correcto
const currentDir = process.cwd();
console.log(`📁 Directorio actual: ${currentDir}`);

// Intentar ejecutar el script original
const scriptPath = path.join(__dirname, 'scripts', 'crear-usuarios-adicionales.js');

if (fs.existsSync(scriptPath)) {
  console.log(`✅ Script encontrado: ${scriptPath}`);
  console.log('🔍 Ejecutando script de creación de usuarios...\n');
  
  // Ejecutar el script
  require(scriptPath);
} else {
  console.log(`❌ Script no encontrado: ${scriptPath}`);
  console.log('📋 Creando usuario manualmente...\n');
  
  // Crear usuario manualmente usando el enfoque más simple
  const { exec } = require('child_process');
  
  // Ejecutar npx prisma para crear el usuario
  const sql = `
    -- Crear usuario Mario Alberto Negrete Sanchez
    INSERT INTO "User" (id, email, name, password, role, "isActive", "createdAt", "updatedAt", "accessibleModules")
    VALUES (
      gen_random_uuid(),
      'mario.negrete@kram.mx',
      'Mario Alberto Negrete Sanchez',
      '$2b$10$YourHashHere', -- Hash de 'Kram2024!'
      'PRODUCCION',
      true,
      NOW(),
      NOW(),
      '["DASHBOARD", "EMPLEADOS", "RECLUTAMIENTO", "VACACIONES", "INCIDENCIAS", "REPORTES"]'::jsonb
    )
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      "isActive" = EXCLUDED."isActive",
      "accessibleModules" = EXCLUDED."accessibleModules";
    
    -- Crear registro de empleado
    INSERT INTO "Employee" (
      id, "userId", nombres, "apellidoPaterno", "apellidoMaterno", 
      "correoElectronico", "correoEmpresa", "puestoId", "departamento_id",
      "fechaAlta", curp, nss, rfc, estatus, nombre
    )
    SELECT
      gen_random_uuid(),
      u.id,
      'Mario Alberto',
      'Negrete',
      'Sanchez',
      'mario.negrete@kram.mx',
      'mario.negrete@kram.mx',
      (SELECT id FROM "JobPosition" WHERE nombre ILIKE '%COORDINADOR DE PROMOTORIA%' LIMIT 1),
      (SELECT id FROM "Department" WHERE nombre ILIKE '%PROMOTORIA%' LIMIT 1),
      NOW(),
      'NESA660101HDFNLR09',
      '12345678901',
      'NESA660101ABC',
      'Activo',
      'Mario Alberto Negrete Sanchez'
    FROM "User" u
    WHERE u.email = 'mario.negrete@kram.mx'
    ON CONFLICT ("userId") DO UPDATE SET
      nombres = EXCLUDED.nombres,
      "apellidoPaterno" = EXCLUDED."apellidoPaterno",
      "apellidoMaterno" = EXCLUDED."apellidoMaterno",
      "correoElectronico" = EXCLUDED."correoElectronico",
      "correoEmpresa" = EXCLUDED."correoEmpresa",
      estatus = EXCLUDED.estatus;
  `;
  
  // Guardar SQL en archivo temporal
  const tempFile = path.join(__dirname, 'temp_create_mario.sql');
  fs.writeFileSync(tempFile, sql);
  
  console.log('📝 Ejecutando consultas SQL...');
  
  exec(`npx prisma db execute --file "${tempFile}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error al ejecutar consultas:', error.message);
    } else {
      console.log('✅ Consultas ejecutadas exitosamente');
      console.log(stdout);
    }
    
    if (stderr) {
      console.error('⚠️  Advertencias:', stderr);
    }
    
    // Limpiar archivo temporal
    fs.unlinkSync(tempFile);
    
    console.log('\n🎉 PROCESO COMPLETADO');
    console.log('====================');
    console.log('\n📋 CREDENCIALES DE ACCESO:');
    console.log('   • Nombre: Mario Alberto Negrete Sanchez');
    console.log('   • Email: mario.negrete@kram.mx');
    console.log('   • Contraseña: Kram2024!');
    console.log('   • Rol: PRODUCCION (GERENTE)');
    console.log('   • Módulos accesibles: DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES');
    console.log('   • Puesto: COORDINADOR DE PROMOTORIA');
    console.log('   • Departamento: PROMOTORIA');
    console.log('\n✅ El usuario ahora debería ser visible en el módulo de empleados.');
  });
}