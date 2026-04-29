const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 INICIANDO CREACIÓN DE USUARIOS ADICIONALES');
  console.log('==============================================\n');

  try {
    // 1. CONFIGURACIÓN INICIAL
    console.log('🔧 1. CONFIGURACIÓN INICIAL');
    console.log('---------------------------');
    
    const defaultPassword = 'Kram2024!';
    const saltRounds = 10;
    
    console.log(`   🔐 Generando hash para contraseña por defecto: ${defaultPassword}`);
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);
    console.log('   ✅ Hash generado exitosamente');
    
    // 2. OBTENER ROLES NECESARIOS
    console.log('\n👥 2. OBTENIENDO ROLES RBAC');
    console.log('---------------------------');
    
    // Buscar roles PRODUCCION (mapeado a GERENTE), RH y COMPRAS
    const gerenteRole = await prisma.role.findUnique({
      where: { name: 'PRODUCCION' }  // PRODUCCION está mapeado a GERENTE en RBAC híbrido
    });
    
    const rhRole = await prisma.role.findUnique({
      where: { name: 'RH' }
    });
    
    const comprasRole = await prisma.role.findUnique({
      where: { name: 'COMPRAS' }  // COMPRAS está mapeado a DIRECTOR en RBAC híbrido
    });
    
    if (!gerenteRole) {
      throw new Error('❌ Rol PRODUCCION (GERENTE) no encontrado en la base de datos. Ejecuta primero el script de configuración de roles.');
    }
    
    if (!rhRole) {
      throw new Error('❌ Rol RH no encontrado en la base de datos. Ejecuta primero el script de configuración de roles.');
    }
    
    if (!comprasRole) {
      throw new Error('❌ Rol COMPRAS (DIRECTOR) no encontrado en la base de datos. Ejecuta primero el script de configuración de roles.');
    }
    
    console.log(`   ✅ Rol PRODUCCION (GERENTE) encontrado (ID: ${gerenteRole.id})`);
    console.log(`   ✅ Rol RH encontrado (ID: ${rhRole.id})`);
    console.log(`   ✅ Rol COMPRAS (DIRECTOR) encontrado (ID: ${comprasRole.id})`);
    
    // 3. CREAR USUARIO 1: MARIO ALBERTO (PROMOTORÍA - GERENTE/PRODUCCION)
    console.log('\n👤 3. CREANDO USUARIO: MARIO ALBERTO NEGRETE SANCHEZ');
    console.log('---------------------------------------------------');
    
    // 3.1. Buscar o crear departamento PROMOTORIA
    console.log('   🔍 Buscando/creando departamento: PROMOTORIA');
    const promotoriaDept = await prisma.department.upsert({
      where: { nombre: 'PROMOTORIA' },
      update: {},
      create: {
        nombre: 'PROMOTORIA',
        descripcion: 'Departamento de Promotoría',
        estado: 'ACTIVO'
      }
    });
    console.log(`   ✅ Departamento PROMOTORIA configurado (ID: ${promotoriaDept.id})`);
    
    // 3.2. Buscar o crear puesto COORDINADOR DE PROMOTORIA
    console.log('   🔍 Buscando/creando puesto: COORDINADOR DE PROMOTORIA');
    const coordinadorPromotoria = await prisma.jobPosition.upsert({
      where: { 
        nombre_departamentoId: {
          nombre: 'COORDINADOR DE PROMOTORIA',
          departamentoId: promotoriaDept.id
        }
      },
      update: {},
      create: {
        nombre: 'COORDINADOR DE PROMOTORIA',
        descripcion: 'Coordinador del departamento de Promotoría',
        departamentoId: promotoriaDept.id,
        nivelJerarquico: 'SUPERVISOR',
        estado: 'ACTIVO'
      }
    });
    console.log(`   ✅ Puesto COORDINADOR DE PROMOTORIA configurado (ID: ${coordinadorPromotoria.id})`);
    
    // 3.3. Crear usuario Mario Alberto
    console.log('   🔍 Verificando si el usuario ya existe: mario.negrete@kram.mx');
    
    const existingMario = await prisma.user.findUnique({
      where: { email: 'mario.negrete@kram.mx' }
    });
    
    if (existingMario) {
      console.log('   ⚠️  Usuario Mario Alberto ya existe, actualizando información...');
      
      await prisma.user.update({
        where: { id: existingMario.id },
        data: {
          name: 'Mario Alberto Negrete Sanchez',
          role: 'PRODUCCION',  // Usamos PRODUCCION que está mapeado a GERENTE
          password: passwordHash,
          isActive: true
        }
      });
      
      console.log('   ✅ Usuario Mario Alberto actualizado');
    } else {
      console.log('   ➕ Creando nuevo usuario: Mario Alberto Negrete Sanchez');
      
      const marioUser = await prisma.user.create({
        data: {
          email: 'mario.negrete@kram.mx',
          name: 'Mario Alberto Negrete Sanchez',
          password: passwordHash,
          role: 'PRODUCCION',  // Usamos PRODUCCION que está mapeado a GERENTE
          isActive: true
        }
      });
      
      console.log(`   ✅ Usuario creado (ID: ${marioUser.id})`);
      
      // 3.4. Crear registro de empleado vinculado
      console.log('   🔗 Creando registro de empleado vinculado...');
      
      // Generar datos ficticios para campos requeridos
      const curpMario = 'NESA660101HDFNLR09'; // CURP ficticio
      const nssMario = '12345678901'; // NSS ficticio
      const rfcMario = 'NESA660101ABC'; // RFC ficticio
      
      await prisma.employee.create({
        data: {
          userId: marioUser.id,
          puestoId: coordinadorPromotoria.id,
          departamento_id: promotoriaDept.id,
          fechaAlta: new Date(),
          curp: curpMario,
          nss: nssMario,
          rfc: rfcMario,
          estatus: 'Activo',
          nombre: 'Mario Alberto Negrete Sanchez'
        }
      });
      
      console.log('   ✅ Registro de empleado creado exitosamente');
    }
    
    // 4. CREAR USUARIO 2: MONSERRAT ALEJANDRA (RECURSOS HUMANOS - RH)
    console.log('\n👤 4. CREANDO USUARIO: MONSERRAT ALEJANDRA HERALDES SANCHEZ');
    console.log('----------------------------------------------------------');
    
    // 4.1. Buscar o crear departamento RECURSOS HUMANOS
    console.log('   🔍 Buscando/creando departamento: RECURSOS HUMANOS');
    const rhDept = await prisma.department.upsert({
      where: { nombre: 'RECURSOS HUMANOS' },
      update: {},
      create: {
        nombre: 'RECURSOS HUMANOS',
        descripcion: 'Departamento de Recursos Humanos',
        estado: 'ACTIVO'
      }
    });
    console.log(`   ✅ Departamento RECURSOS HUMANOS configurado (ID: ${rhDept.id})`);
    
    // 4.2. Buscar o crear puesto AUXILIAR DE RECURSOS HUMANOS
    console.log('   🔍 Buscando/creando puesto: AUXILIAR DE RECURSOS HUMANOS');
    const auxiliarRH = await prisma.jobPosition.upsert({
      where: { 
        nombre_departamentoId: {
          nombre: 'AUXILIAR DE RECURSOS HUMANOS',
          departamentoId: rhDept.id
        }
      },
      update: {},
      create: {
        nombre: 'AUXILIAR DE RECURSOS HUMANOS',
        descripcion: 'Auxiliar del departamento de Recursos Humanos',
        departamentoId: rhDept.id,
        nivelJerarquico: 'OPERATIVO',
        estado: 'ACTIVO'
      }
    });
    console.log(`   ✅ Puesto AUXILIAR DE RECURSOS HUMANOS configurado (ID: ${auxiliarRH.id})`);
    
    // 4.3. Crear usuario Monserrat Alejandra
    console.log('   🔍 Verificando si el usuario ya existe: rhauxiliar@kram.mx');
    
    const existingMonserrat = await prisma.user.findUnique({
      where: { email: 'rhauxiliar@kram.mx' }
    });
    
    if (existingMonserrat) {
      console.log('   ⚠️  Usuario Monserrat Alejandra ya existe, actualizando información...');
      
      await prisma.user.update({
        where: { id: existingMonserrat.id },
        data: {
          name: 'Monserrat Alejandra Heraldes Sanchez',
          role: 'RH',
          password: passwordHash,
          isActive: true
        }
      });
      
      console.log('   ✅ Usuario Monserrat Alejandra actualizado');
    } else {
      console.log('   ➕ Creando nuevo usuario: Monserrat Alejandra Heraldes Sanchez');
      
      const monserratUser = await prisma.user.create({
        data: {
          email: 'rhauxiliar@kram.mx',
          name: 'Monserrat Alejandra Heraldes Sanchez',
          password: passwordHash,
          role: 'RH',
          isActive: true
        }
      });
      
      console.log(`   ✅ Usuario creado (ID: ${monserratUser.id})`);
      
      // 4.4. Crear registro de empleado vinculado
      console.log('   🔗 Creando registro de empleado vinculado...');
      
      // Generar datos ficticios para campos requeridos
      const curpMonserrat = 'HESA880202MDFNLR08'; // CURP ficticio
      const nssMonserrat = '98765432109'; // NSS ficticio
      const rfcMonserrat = 'HESA880202XYZ'; // RFC ficticio
      
      await prisma.employee.create({
        data: {
          userId: monserratUser.id,
          puestoId: auxiliarRH.id,
          departamento_id: rhDept.id,
          fechaAlta: new Date(),
          curp: curpMonserrat,
          nss: nssMonserrat,
          rfc: rfcMonserrat,
          estatus: 'Activo',
          nombre: 'Monserrat Alejandra Heraldes Sanchez'
        }
      });
      
      console.log('   ✅ Registro de empleado creado exitosamente');
    }
    
    // 5. CREAR USUARIO 3: NORMA OLGUIN FLORES (CONTABILIDAD - COMPRAS/DIRECTOR)
    console.log('\n👤 5. CREANDO USUARIO: NORMA OLGUIN FLORES');
    console.log('------------------------------------------');
    
    // 5.1. Buscar o crear departamento CONTABILIDAD
    console.log('   🔍 Buscando/creando departamento: CONTABILIDAD');
    const contabilidadDept = await prisma.department.upsert({
      where: { nombre: 'CONTABILIDAD' },
      update: {},
      create: {
        nombre: 'CONTABILIDAD',
        descripcion: 'Departamento de Contabilidad',
        estado: 'ACTIVO'
      }
    });
    console.log(`   ✅ Departamento CONTABILIDAD configurado (ID: ${contabilidadDept.id})`);
    
    // 5.2. Buscar o crear puesto JEFE CONTABLE
    console.log('   🔍 Buscando/creando puesto: JEFE CONTABLE');
    const jefeContable = await prisma.jobPosition.upsert({
      where: { 
        nombre_departamentoId: {
          nombre: 'JEFE CONTABLE',
          departamentoId: contabilidadDept.id
        }
      },
      update: {},
      create: {
        nombre: 'JEFE CONTABLE',
        descripcion: 'Jefe del departamento de Contabilidad',
        departamentoId: contabilidadDept.id,
        nivelJerarquico: 'DIRECTOR',
        estado: 'ACTIVO'
      }
    });
    console.log(`   ✅ Puesto JEFE CONTABLE configurado (ID: ${jefeContable.id})`);
    
    // 5.3. Crear usuario Norma Olguin Flores
    console.log('   🔍 Verificando si el usuario ya existe: contabilidad@kram.mx');
    
    const existingNorma = await prisma.user.findUnique({
      where: { email: 'contabilidad@kram.mx' }
    });
    
    if (existingNorma) {
      console.log('   ⚠️  Usuario Norma Olguin Flores ya existe, actualizando información...');
      
      await prisma.user.update({
        where: { id: existingNorma.id },
        data: {
          name: 'Norma Olguin Flores',
          role: 'COMPRAS',  // Usamos COMPRAS que está mapeado a DIRECTOR
          password: passwordHash,
          isActive: true
        }
      });
      
      console.log('   ✅ Usuario Norma Olguin Flores actualizado');
    } else {
      console.log('   ➕ Creando nuevo usuario: Norma Olguin Flores');
      
      const normaUser = await prisma.user.create({
        data: {
          email: 'contabilidad@kram.mx',
          name: 'Norma Olguin Flores',
          password: passwordHash,
          role: 'COMPRAS',  // Usamos COMPRAS que está mapeado a DIRECTOR
          isActive: true
        }
      });
      
      console.log(`   ✅ Usuario creado (ID: ${normaUser.id})`);
      
      // 5.4. Crear registro de empleado vinculado
      console.log('   🔗 Creando registro de empleado vinculado...');
      
      // Generar datos ficticios para campos requeridos
      const curpNorma = 'OLFN750303MDFLNR07'; // CURP ficticio
      const nssNorma = '45678901234'; // NSS ficticio
      const rfcNorma = 'OLFN750303DEF'; // RFC ficticio
      
      await prisma.employee.create({
        data: {
          userId: normaUser.id,
          puestoId: jefeContable.id,
          departamento_id: contabilidadDept.id,
          fechaAlta: new Date(),
          curp: curpNorma,
          nss: nssNorma,
          rfc: rfcNorma,
          estatus: 'Activo',
          nombre: 'Norma Olguin Flores'
        }
      });
      
      console.log('   ✅ Registro de empleado creado exitosamente');
    }
    
    // 6. VERIFICACIÓN FINAL
    console.log('\n📊 6. VERIFICACIÓN FINAL');
    console.log('------------------------');
    
    // Verificar usuarios creados
    const usuariosCreados = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'mario.negrete@kram.mx' },
          { email: 'rhauxiliar@kram.mx' },
          { email: 'contabilidad@kram.mx' }
        ]
      },
      include: {
        employee: {
          include: {
            puesto: true,
            departamento: true
          }
        }
      }
    });
    
    console.log(`   👥 Usuarios verificados: ${usuariosCreados.length}`);
    console.log('   📋 Detalles de usuarios creados:');
    
    usuariosCreados.forEach(user => {
      console.log(`\n      • ${user.name} (${user.email})`);
      console.log(`        Rol: ${user.role}, Activo: ${user.isActive}`);
      
      if (user.employee) {
        console.log(`        Departamento: ${user.employee.departamento?.nombre || 'No asignado'}`);
        console.log(`        Puesto: ${user.employee.puesto?.nombre || 'No asignado'}`);
        console.log(`        Nivel Jerárquico: ${user.employee.puesto?.nivelJerarquico || 'No definido'}`);
      } else {
        console.log('        ⚠️  No tiene registro de empleado vinculado');
      }
    });
    
    // 7. RESUMEN
    console.log('\n🎯 RESUMEN DE LA CREACIÓN DE USUARIOS');
    console.log('=====================================');
    console.log('✅ OPERACIONES COMPLETADAS:');
    console.log('   1. Hash de contraseña generado para "Kram2024!"');
    console.log('   2. Roles PRODUCCION (GERENTE), RH y COMPRAS (DIRECTOR) verificados');
    console.log('   3. Departamento PROMOTORIA creado/configurado');
    console.log('   4. Puesto COORDINADOR DE PROMOTORIA creado/configurado');
    console.log('   5. Usuario Mario Alberto Negrete Sanchez creado/asignado');
    console.log('   6. Departamento RECURSOS HUMANOS creado/configurado');
    console.log('   7. Puesto AUXILIAR DE RECURSOS HUMANOS creado/configurado');
    console.log('   8. Usuario Monserrat Alejandra Heraldes Sanchez creado/asignado');
    console.log('   9. Departamento CONTABILIDAD creado/configurado');
    console.log('   10. Puesto JEFE CONTABLE creado/configurado');
    console.log('   11. Usuario Norma Olguin Flores creado/asignado');
    
    console.log('\n📋 CREDENCIALES DE ACCESO:');
    console.log('   • Mario Alberto Negrete Sanchez');
    console.log('     Email: mario.negrete@kram.mx');
    console.log('     Contraseña: Kram2024!');
    console.log('     Rol: PRODUCCION (GERENTE en RBAC híbrido)');
    console.log('     Departamento: PROMOTORIA');
    console.log('     Puesto: COORDINADOR DE PROMOTORIA');
    
    console.log('\n   • Monserrat Alejandra Heraldes Sanchez');
    console.log('     Email: rhauxiliar@kram.mx');
    console.log('     Contraseña: Kram2024!');
    console.log('     Rol: RH');
    console.log('     Departamento: RECURSOS HUMANOS');
    console.log('     Puesto: AUXILIAR DE RECURSOS HUMANOS');
    
    console.log('\n   • Norma Olguin Flores');
    console.log('     Email: contabilidad@kram.mx');
    console.log('     Contraseña: Kram2024!');
    console.log('     Rol: COMPRAS (DIRECTOR en RBAC híbrido)');
    console.log('     Departamento: CONTABILIDAD');
    console.log('     Puesto: JEFE CONTABLE');
    
    console.log('\n🚀 CREACIÓN DE USUARIOS ADICIONALES COMPLETADA EXITOSAMENTE');
    console.log('💡 Los usuarios pueden iniciar sesión con las credenciales proporcionadas.');
    console.log('💡 Se respetó la estandarización de MAYÚSCULAS para departamentos y puestos.');
    
  } catch (error) {
    console.error('❌ ERROR DURANTE LA CREACIÓN DE USUARIOS:', error.message);
    console.error('   Detalles:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error fatal:', e);
    await prisma.$disconnect();
    process.exit(1);
  });