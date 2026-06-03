const http = require('http');

// 1. Login como admin
const loginAdmin = () => new Promise((resolve, reject) => {
  const data = JSON.stringify({ email: 'admin@kram.com', password: 'password123' });
  const req = http.request({
    hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
  }, res => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(b)})); });
  req.write(data); req.end();
});

// 2. Reset password de alopez
const resetPassword = (token) => new Promise((resolve, reject) => {
  const data = JSON.stringify({ newPassword: 'MiNuevaPass123!' });
  const req = http.request({
    hostname: 'localhost', port: 3001, path: '/api/users/cmpxoe4us00367nmw64qkaana/reset-password', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length, 'Authorization': `Bearer ${token}` }
  }, res => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(b)})); });
  req.write(data); req.end();
});

// 3. Login como alopez
const loginAlopez = () => new Promise((resolve, reject) => {
  const data = JSON.stringify({ email: 'alopez.umb@gmail.com', password: 'MiNuevaPass123!' });
  const req = http.request({
    hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
  }, res => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(b)})); });
  req.write(data); req.end();
});

async function main() {
  console.log('1. Login como admin...');
  const admin = await loginAdmin();
  console.log('   Status:', admin.status);
  if (admin.status !== 200) { console.log('   Error:', admin.body); return; }
  console.log('   ✅ Token obtenido');
  
  console.log('2. Reset password de alopez...');
  const reset = await resetPassword(admin.body.token);
  console.log('   Status:', reset.status);
  console.log('   Response:', reset.body);
  
  console.log('3. Login como alopez con nueva contraseña...');
  const alopez = await loginAlopez();
  console.log('   Status:', alopez.status);
  if (alopez.status === 200) {
    console.log('   ✅✅✅ LOGIN EXITOSO');
  } else {
    console.log('   ❌ Error:', alopez.body);
  }
}

main().catch(console.error);
