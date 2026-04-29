// Script simple para verificar empleado usando Prisma
const { exec } = require('child_process');
const fs = require('fs');

// Crear archivo SQL temporal
const sqlContent = `
SELECT 
    id,
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    correoElectronico,
    correoEmpresa,
    estatus,
    fechaAlta,
    puestoId,
    departamento_id
FROM Employee
WHERE 
    (correoElectronico = 'mario.negrete@kram.mx' OR correoEmpresa = 'mario.negrete@kram.mx')
    OR (nombres LIKE '%Mario%' AND apellidoPaterno LIKE '%Negrete%' AND apellidoMaterno LIKE '%Sanchez%')
ORDER BY fechaAlta DESC
LIMIT 10;
`;

fs.writeFileSync('temp_check_employee.sql', sqlContent);

console.log('🔍 Buscando empleado: Mario Alberto Negrete Sanchez (mario.negrete@kram.mx)');
console.log('='.repeat(60));

// Ejecutar consulta usando npx prisma
exec('npx prisma db execute --file temp_check_employee.sql --stdout', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error al ejecutar la consulta:', error.message);
    return;
  }
  
  if (stderr) {
    console.error('⚠️  Advertencia:', stderr);
  }
  
  console.log('📊 RESULTADOS DE LA BÚSQUEDA:');
  console.log('='.repeat(60));
  
  if (stdout.trim()) {
    console.log(stdout);
    
    // Analizar resultados
    const lines = stdout.trim().split('\n');
    if (lines.length > 2) { // Más que solo encabezados
      console.log('\n✅ EMPLEADO ENCONTRADO EN LA BASE DE DATOS');
      console.log('='.repeat(60));
      
      // Mostrar información detallada
      lines.forEach((line, index) => {
        if (index === 0) return; // Saltar encabezado
        if (line.trim()) {
          const columns = line.split('|').map(col => col.trim());
          if (columns.length >= 6) {
            console.log(`\n📋 Información del empleado:`);
            console.log(`   ID: ${columns[0]}`);
            console.log(`   Nombre: ${columns[1]} ${columns[2]} ${columns[3]}`);
            console.log(`   Correo personal: ${columns[4]}`);
            console.log(`   Correo empresa: ${columns[5]}`);
            console.log(`   Estatus: ${columns[6]}`);
            console.log(`   Fecha alta: ${columns[7]}`);
          }
        }
      });
    } else {
      console.log('\n❌ EMPLEADO NO ENCONTRADO EN LA BASE DE DATOS');
      console.log('='.repeat(60));
      console.log('El empleado "Mario Alberto Negrete Sanchez" con correo "mario.negrete@kram.mx"');
      console.log('NO existe en la base de datos actual.');
    }
  } else {
    console.log('\n❌ EMPLEADO NO ENCONTRADO EN LA BASE DE DATOS');
    console.log('='.repeat(60));
    console.log('El empleado "Mario Alberto Negrete Sanchez" con correo "mario.negrete@kram.mx"');
    console.log('NO existe en la base de datos actual.');
  }
  
  // Limpiar archivo temporal
  fs.unlinkSync('temp_check_employee.sql');
});