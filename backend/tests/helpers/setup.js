/**
 * Test Helper - ERP KRAM
 * Configuración compartida para todas las pruebas
 */

const http = require('http');
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

/**
 * Realiza una petición HTTP
 * @param {string} method - Método HTTP
 * @param {string} path - Ruta del endpoint
 * @param {object|null} body - Cuerpo de la petición
 * @param {string|null} token - Token JWT
 * @returns {Promise<{status: number, body: object}>}
 */
function request(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: { error: e.code, message: e.message } }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: { error: 'TIMEOUT' } }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Obtiene un token JWT para pruebas
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string|null>}
 */
async function getToken(email = 'admin@kram.com', password = 'password123') {
  const res = await request('POST', '/api/auth/login', { email, password });
  if (res.status === 200 && res.body.token) {
    return res.body.token;
  }
  return null;
}

/**
 * Sube un archivo (multipart/form-data) usando fetch/FormData nativos de
 * Node (18+) — `request()` de arriba solo envía JSON, no sirve para
 * endpoints que exigen un archivo (ej. importación de CSV).
 *
 * @param {string} path - Ruta del endpoint
 * @param {string|null} token - Token JWT
 * @param {object} fields - Campos de texto adicionales del form
 * @param {string} fileField - Nombre del campo del archivo (ej. 'file')
 * @param {Buffer} buffer - Contenido del archivo
 * @param {string} filename - Nombre de archivo a declarar
 * @returns {Promise<{status: number, body: object}>}
 */
async function uploadFile(path, token, fields, fileField, buffer, filename) {
  const form = new FormData();
  Object.entries(fields || {}).forEach(([key, value]) => form.append(key, value));
  form.append(fileField, new Blob([buffer]), filename);

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(new URL(path, BASE_URL), { method: 'POST', headers, body: form });
  let body;
  try { body = await res.json(); }
  catch { body = await res.text(); }
  return { status: res.status, body };
}

module.exports = { request, getToken, uploadFile, BASE_URL };
