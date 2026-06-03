const http = require('http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // Ver hash antes
  let user = await prisma.user.findUnique({ where: { email: 'alopez.umb@gmail.com' } });
  console.log('Hash ANTES del reset:', user.password);
  
  // Login como admin
  const loginData = JSON.stringify({ email: 'admin@kram.com', password: 'password123' });
  
  const loginReq = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', async () => {
      const response = JSON.parse(body);
      console.log('Login response status:', res.statusCode);
      
      if (response.token) {
        console.log('✅ Login exitoso como admin');
        
        // Resetear contraseña
        const NEW_PASS = 'MiNuevaPass123!';
        const resetData = JSON.stringify({ newPassword: NEW_PASS });
        const resetReq = http.request({
          hostname: 'localhost',
          port: 3001,
          path: '/api/users/cmpxoe4us00367nmw64qkaana/reset-password',
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Content-Length': resetData.length,
            'Authorization': `Bearer ${response.token}`
          }
        }, async (res2) => {
          let body2 = '';
          res2.on('data', chunk => body2 += chunk);
          res2.on('end', async () => {
            console.log('Reset password response status:', res2.statusCode);
            console.log('Reset password response:', body2);
            
            // Verificar hash DESPUÉS del reset
            user = await prisma.user.findUnique({ where: { email: 'alopez.umb@gmail.com' } });
            console.log('Hash DESPUÉS del reset:', user.password);
            const valid = await bcrypt.compare(NEW_PASS, user.password);
            console.log(`bcrypt.compare("${NEW_PASS}", hash): ${valid}`);
            
            // Probar login HTTP
            const testLoginData = JSON.stringify({ email: 'alopez.umb@gmail.com', password: NEW_PASS });
            const testReq = http.request({
              hostname: 'localhost',
              port: 3001,
              path: '/api/auth/login',
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Content-Length': testLoginData.length }
            }, (res3) => {
              let body3 = '';
              res3.on('data', chunk => body3 += chunk);
              res3.on('end', () => {
                console.log('Test login response status:', res3.statusCode);
                console.log('Test login response:', body3);
              });
            });
            testReq.write(testLoginData);
            testReq.end();
            
            await prisma.$disconnect();
          });
        });
        resetReq.write(resetData);
        resetReq.end();
      } else {
        console.log('❌ Login falló:', body);
        await prisma.$disconnect();
      }
    });
  });
  loginReq.write(loginData);
  loginReq.end();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
