/**
 * Script de prueba para crear vacantes con diferentes motivos de solicitud
 * 
 * Uso: node test_vacancy_motivos.js
 * 
 * Requiere que el backend esté corriendo en http://localhost:3001
 */

const BASE_URL = 'http://localhost:3001';

// Credenciales del usuario de prueba
const TEST_USER = {
  email: 'alopez.umb@gmail.com',
  password: 'Kram2026.'
};

// Motivos de solicitud a probar (valores del enum MotivoVacante en Prisma)
const MOTIVOS = [
  'NUEVA_CREACION',
  'REEMPLAZO_DEFINITIVO',
  'REEMPLAZO_TEMPORAL',
  'REEMPLAZO_RENUNCIA',
  'REEMPLAZO_TERMINACION_CONTRATO',
  'INCREMENTO_PLANTILLA',
  'INCREMENTO_PRODUCCION',
  'RENUNCIA',
  'TERMINACION_CONTRATO',
  'LICENCIA',
  'LICENCIA_TEMPORAL',
  'INCAPACIDAD',
  'JUBILACION',
  'JUBILACION_RETIRO',
  'PROMOCION',
  'REESTRUCTURACION',
  'MATERNIDAD',
  'LICENCIA_MATERNIDAD',
  'VACACIONES'
];

let token = null;

async function login() {
  console.log('\n🔐 Iniciando sesión...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('❌ Error de login:', data);
    process.exit(1);
  }
  
  token = data.token;
  console.log(`✅ Login exitoso como: ${data.user.name} (${data.user.role})`);
  console.log(`   Módulos: ${data.user.accessibleModules?.join(', ') || 'N/A'}`);
  return data;
}

async function getDepartments() {
  console.log('\n📋 Obteniendo departamentos...');
  const response = await fetch(`${BASE_URL}/api/vacancies/form-data`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('❌ Error al obtener departamentos:', data);
    return null;
  }
  
  console.log(`✅ ${data.data?.length || 0} departamentos encontrados`);
  if (data.data?.length > 0) {
    data.data.forEach(d => console.log(`   - ${d.id}: ${d.nombre}`));
  }
  return data.data;
}

async function createVacancy(motivo, index, departamentoId) {
  console.log(`\n📝 [${index + 1}/${MOTIVOS.length}] Creando vacante con motivo: "${motivo}"`);
  
  const body = {
    titulo: `Vacante Test - ${motivo} - ${Date.now()}`,
    departamento_id: departamentoId,
    motivoSolicitud: motivo,
    numeroVacantes: 1,
    tipoContratacion: 'ADMINISTRATIVO',
    entrevistadorTecnico: 'Test',
    requerimientos_tecnicos: ['Conocimiento en pruebas'],
    isDirect: false
  };
  
  // Agregar campos específicos para motivos que requieren persona a reemplazar
  const reemplazoMotivos = ['REEMPLAZO_DEFINITIVO', 'REEMPLAZO_TEMPORAL', 'REEMPLAZO_RENUNCIA', 'REEMPLAZO_TERMINACION_CONTRATO', 'RENUNCIA', 'TERMINACION_CONTRATO', 'LICENCIA', 'LICENCIA_TEMPORAL', 'INCAPACIDAD', 'JUBILACION', 'JUBILACION_RETIRO', 'PROMOCION', 'MATERNIDAD', 'LICENCIA_MATERNIDAD', 'VACACIONES'];
  if (reemplazoMotivos.includes(motivo)) {
    body.personaAReemplazarNombre = 'Juan Pérez';
    body.personaAReemplazarCargo = 'Analista';
  }
  
  const response = await fetch(`${BASE_URL}/api/recruitment/vacancies`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log(`   ✅ VACANTE CREADA - ID: ${data.vacancy?.id || 'N/A'}`);
    console.log(`      Título: ${data.vacancy?.titulo || 'N/A'}`);
    console.log(`      Estatus: ${data.vacancy?.estatus || 'N/A'}`);
    return { success: true, data: data.vacancy };
  } else {
    console.log(`   ❌ ERROR: ${data.error || 'Sin mensaje de error'}`);
    if (data.details) console.log(`      Detalles: ${data.details}`);
    console.log(`      Response completo:`, JSON.stringify(data, null, 4));
    return { success: false, error: data };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('  PRUEBA DE MOTIVOS DE SOLICITUD');
  console.log('========================================');
  
  // Login
  const userData = await login();
  
  // Verificar que el usuario tenga RECLUTAMIENTO
  if (!userData.user.accessibleModules?.includes('RECLUTAMIENTO')) {
    console.log('\n⚠️ El usuario no tiene acceso al módulo RECLUTAMIENTO');
    console.log('   Intentando de todas formas...');
  }
  
  // Obtener departamentos
  const departments = await getDepartments();
  
  // Usar el ID real de SISTEMAS
  const sistemasDept = departments?.find(d => d.nombre === 'SISTEMAS');
  const departamentoId = sistemasDept?.id || departments?.[0]?.id;
  console.log(`\n📌 Usando departamento: ${sistemasDept?.nombre || 'Primero disponible'} (ID: ${departamentoId})`);
  
  // Probar cada motivo
  console.log('\n========================================');
  console.log('  INICIANDO PRUEBAS');
  console.log('========================================');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < MOTIVOS.length; i++) {
    const result = await createVacancy(MOTIVOS[i], i, departamentoId);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  // Resumen
  console.log('\n========================================');
  console.log('  RESUMEN DE PRUEBAS');
  console.log('========================================');
  console.log(`  Total motivos probados: ${MOTIVOS.length}`);
  console.log(`  ✅ Exitosos: ${successCount}`);
  console.log(`  ❌ Fallidos: ${failCount}`);
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
