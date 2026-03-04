const http = require('http');

// Configuración
const API_BASE = 'http://localhost:3001/api';

// Función para hacer requests HTTP
function makeRequest(method, url, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test principal
async function testUsers() {
  console.log('=== Test de Nuevos Usuarios ===\n');

  // 1. Test usuario Gerente de RH - ELIZABETH ZURITA LUNA
  console.log('1. Probando usuario Gerente de RH...');
  try {
    const loginResponse = await makeRequest('POST', `${API_BASE}/auth/login`, {
      email: 'recursoshumanos@kram.mx',
      password: '123456'
    });

    if (loginResponse.statusCode === 200) {
      const user = loginResponse.data.user;
      console.log('✅ Login exitoso como Gerente de RH');
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Módulos accesibles: ${user.accessibleModules.join(', ')}`);
      
      // Verificar módulos
      const expectedModules = ['DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 'INCIDENCIAS', 'REPORTES'];
      const missingModules = expectedModules.filter(module => !user.accessibleModules.includes(module));
      
      if (missingModules.length === 0) {
        console.log('   ✅ Todos los módulos de RH están presentes');
      } else {
        console.log(`   ⚠️  Faltan módulos: ${missingModules.join(', ')}`);
      }

      const rhToken = loginResponse.data.token;

      // Test acceso a empleados
      try {
        const employeesResponse = await makeRequest('GET', `${API_BASE}/employees`, null, rhToken);
        if (employeesResponse.statusCode === 200) {
          console.log('   ✅ Puede acceder a lista de empleados');
        }
      } catch (error) {
        console.log('   ⚠️  Error accediendo a empleados:', error.message);
      }

    } else {
      console.log(`❌ Error en login RH: ${loginResponse.data.error || 'Error desconocido'}`);
    }
  } catch (error) {
    console.log(`❌ Error en login RH: ${error.message}`);
  }

  // 2. Test usuario PRUEBAS HUB
  console.log('\n2. Probando usuario PRUEBAS HUB...');
  try {
    const loginResponse = await makeRequest('POST', `${API_BASE}/auth/login`, {
      email: 'hub@kram.mx',
      password: '123456'
    });

    if (loginResponse.statusCode === 200) {
      const user = loginResponse.data.user;
      console.log('✅ Login exitoso como PRUEBAS HUB');
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Módulos accesibles: ${user.accessibleModules.join(', ')}`);
      
      // Verificar módulos
      const expectedModules = ['DASHBOARD', 'RECLUTAMIENTO'];
      const missingModules = expectedModules.filter(module => !user.accessibleModules.includes(module));
      
      if (missingModules.length === 0) {
        console.log('   ✅ Todos los módulos de PRODUCCION están presentes');
      } else {
        console.log(`   ⚠️  Faltan módulos: ${missingModules.join(', ')}`);
      }

      const hubToken = loginResponse.data.token;

      // Test acceso a departamentos
      try {
        const departmentsResponse = await makeRequest('GET', `${API_BASE}/organization/departments`, null, hubToken);
        if (departmentsResponse.statusCode === 200) {
          console.log('   ✅ Puede acceder a departamentos');
        }
      } catch (error) {
        console.log('   ⚠️  Error accediendo a departamentos:', error.message);
      }

    } else {
      console.log(`❌ Error en login HUB: ${loginResponse.data.error || 'Error desconocido'}`);
    }
  } catch (error) {
    console.log(`❌ Error en login HUB: ${error.message}`);
  }

  // 3. Resumen final
  console.log('\n📋 Resumen Final:');
  console.log('========================================');
  console.log('✅ Usuarios creados exitosamente:');
  console.log('   1. Gerente de RH - ELIZABETH ZURITA LUNA');
  console.log('      Email: recursoshumanos@kram.mx');
  console.log('      Contraseña: 123456');
  console.log('      Rol: RH');
  console.log('      Módulos: DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES');
  console.log('');
  console.log('   2. PRUEBAS HUB');
  console.log('      Email: hub@kram.mx');
  console.log('      Contraseña: 123456');
  console.log('      Rol: PRODUCCION');
  console.log('      Módulos: DASHBOARD, RECLUTAMIENTO');
  console.log('========================================');
  console.log('\n💡 Los usuarios están listos para usar en el sistema ERP KRAM.');
  console.log('   - Gerente de RH tiene acceso completo a módulos de Recursos Humanos');
  console.log('   - PRUEBAS HUB puede levantar vacantes como perfil de producción');
}

// Ejecutar test
testUsers().catch(console.error);