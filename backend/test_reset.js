const http = require('http');

// Primero hacer login como admin para obtener token
const loginData = JSON.stringify({ email: 'admin@kram.com', password: 'Admin123!' });

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
      console.log('✅ Login exitoso, token obtenido');
      
      // Ahora resetear la contraseña de alopez
      const resetData = JSON.stringify({ newPassword: 'MiNuevaPass123!' });
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
          console.log('Reset password response body:', body2);
          
          // Ahora probar login con la nueva contraseña
          const testLoginData = JSON.stringify({ email: 'alopez.umb@gmail.com', password: 'MiNuevaPass123!' });
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
                console.log('✅✅✅ LOGIN EXITOSO con nueva contraseña');
              } else {
                console.log('❌ Login falló:', body3);
              }
            });
          });
          testReq.write(testLoginData);
          testReq.end();
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
