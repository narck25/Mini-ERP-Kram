const http = require('http');

// Login como admin con la contraseña correcta
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
  res.on('end', () => {
    const response = JSON.parse(body);
    console.log('Login response status:', res.statusCode);
    
    if (response.token) {
      console.log('✅ Login exitoso como admin');
      
      // Resetear contraseña de alopez
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
      }, (res2) => {
        let body2 = '';
        res2.on('data', chunk => body2 += chunk);
        res2.on('end', () => {
          console.log('Reset password response status:', res2.statusCode);
          console.log('Reset password response:', body2);
          
          if (res2.statusCode === 200) {
            // Probar login con la nueva contraseña
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
                if (res3.statusCode === 200) {
                  console.log('✅✅✅ FLUJO COMPLETO FUNCIONA');
                } else {
                  console.log('❌ Login falló:', body3);
                }
              });
            });
            testReq.write(testLoginData);
            testReq.end();
          }
        });
      });
      resetReq.write(resetData);
      resetReq.end();
    } else {
      console.log('❌ Login falló:', body);
    }
  });
});
loginReq.write(loginData);
loginReq.end();
