const http = require('http');

const getToken = async (email, password) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: email,
      password: password
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Token obtenido exitosamente para ${email}:`);
            console.log('Token completo:', parsedData.token);
            console.log('Token length:', parsedData.token.length);
            console.log('User:', JSON.stringify(parsedData.user, null, 2));
            resolve(parsedData.token);
          } else {
            console.error('❌ Error obteniendo token:');
            console.error('Status:', res.statusCode);
            console.error('Data:', parsedData);
            reject(new Error(`HTTP ${res.statusCode}: ${parsedData.error || 'Unknown error'}`));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Network error:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

// Probar con diferentes usuarios
(async () => {
  try {
    // Admin
    const adminToken = await getToken('admin@kram.com', 'password123');
    console.log('\n---\n');
    
    // Sistemas
    const sistemasToken = await getToken('sistemas@kram.com', 'password123');
    console.log('\n---\n');
    
    // Compras
    const comprasToken = await getToken('compras@kram.com', 'password123');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
