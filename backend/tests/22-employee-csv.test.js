/**
 * Importación/exportación CSV de empleados — sin cobertura automatizada
 * previa (ver PROJECT_CONTEXT.md §12.4). requireRHOrAdmin() en las 3 rutas
 * (/employees/template, /employees/import, /employees/export).
 *
 * No se prueba una importación exitosa completa (requiere construir una
 * fila con ~35 columnas válidas — RFC/CURP/NSS con formato exacto, puesto y
 * departamento reales, etc. — alto riesgo de una prueba frágil para el
 * valor que aporta). Se cubre lo que si es de bajo riesgo y alto valor:
 * permisos, forma de la plantilla/exportación, y el camino de error real
 * más importante — que ahora valida el contenido real del archivo, no solo
 * la extensión ".csv" (ver Hallazgo #9, backend/src/middlewares/upload.middleware.js).
 */
const { request, getToken, uploadFile } = require('./helpers/setup');

describe('🧪 Importación/exportación CSV de empleados', () => {
  let adminToken = null;
  let basicToken = null;

  beforeAll(async () => {
    adminToken = await getToken();
    basicToken = await getToken('nayely.mendez@kram.mx', '123456');
    if (!adminToken || !basicToken) {
      throw new Error('No se pudo autenticar admin/nayely.mendez. Verifica prisma/seed.js.');
    }
  });

  test('Un usuario sin rol ADMIN/RH no puede descargar la plantilla (403)', async () => {
    const res = await request('GET', '/api/employees/template', null, basicToken);
    expect(res.status).toBe(403);
  });

  test('RH/ADMIN descarga la plantilla con las columnas obligatorias', async () => {
    const res = await request('GET', '/api/employees/template', null, adminToken);
    expect(res.status).toBe(200);
    ['RFC', 'CURP', 'NSS', 'FECHA ALTA', 'PUESTO'].forEach((col) => {
      expect(res.body).toContain(col);
    });
  });

  test('Un usuario sin rol ADMIN/RH no puede exportar (403)', async () => {
    const res = await request('GET', '/api/employees/export', null, basicToken);
    expect(res.status).toBe(403);
  });

  test('RH/ADMIN exporta el CSV de empleados (200, no vacío)', async () => {
    const res = await request('GET', '/api/employees/export', null, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('Un usuario sin rol ADMIN/RH no puede importar (403)', async () => {
    const res = await uploadFile('/api/employees/import', basicToken, {}, 'file', Buffer.from('RFC,CURP\n'), 'empleados.csv');
    expect(res.status).toBe(403);
  });

  test('Sin archivo (400)', async () => {
    const res = await request('POST', '/api/employees/import', {}, adminToken);
    expect(res.status).toBe(400);
  });

  test('Rechaza un archivo cuyo contenido no es realmente un CSV (400, Hallazgo #9)', async () => {
    // Encabezado real de un PDF, con extensión .csv — el mismo caso que
    // motivó la validación de contenido real de los archivos subidos.
    const fakeCsv = Buffer.from('%PDF-1.4\nesto no es un CSV');
    const res = await uploadFile('/api/employees/import', adminToken, {}, 'file', fakeCsv, 'empleados.csv');
    expect(res.status).toBe(400);
  });

  test('CSV vacío, sin filas de datos (400)', async () => {
    const res = await uploadFile('/api/employees/import', adminToken, {}, 'file', Buffer.from('RFC,CURP,NSS\n'), 'vacio.csv');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/vacío/i);
  });

  test('CSV con datos pero sin las columnas obligatorias (400, indica cuáles faltan)', async () => {
    const csv = 'NOMBRES,APELLIDO PATERNO\nJuan,Perez\n';
    const res = await uploadFile('/api/employees/import', adminToken, {}, 'file', Buffer.from(csv), 'incompleto.csv');
    expect(res.status).toBe(400);
    expect(res.body.missingHeaders).toEqual(expect.arrayContaining(['RFC', 'CURP', 'NSS', 'FECHA ALTA', 'PUESTO']));
  });
});
