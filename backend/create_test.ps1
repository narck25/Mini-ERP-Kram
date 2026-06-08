$c = @'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const emails = [
    'heraldes@hotmail.com',
    'alopez.umb@gmail.com',
    'zuritalunae@hotmail.com',
    'soporteti@kram.mx',
    'jluisgguillen1125@gmail.com',
    'nolguin73@hotmail.com'
  ];
  
  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, accessibleModules: true }
    });
    if (user) {
      console.log('========================================');
      console.log('Nombre:', user.name);
      console.log('Email:', user.email);
      console.log('Rol:', user.role);
      console.log('Modulos accesibles:', user.accessibleModules?.join(', ') || 'NINGUNO');
      console.log('');
    } else {
      console.log('========================================');
      console.log('Email:', email, '-> NO ENCONTRADO');
      console.log('');
    }
  }
  
  await prisma.$disconnect();
}

test().catch(e => { console.error(e); prisma.$disconnect(); });
'@
Set-Content -Path test_clean.js -Value $c
Write-Host "File created successfully"
</｜｜DSML｜｜parameter>
</write_to_file>