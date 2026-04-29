const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Datos proporcionados
const departamentosData = [
  { departamento: "ADMINISTRACION", puestos: ["GERENTE DE ADMINISTRACIÓN", "JEFE DE RECURSOS HUMANOS Y NOMINAS", "SOPORTE TI"] },
  { departamento: "ALMACEN", puestos: ["JEFE DE ALMACÉN", "ANALISTA DE CALIDAD", "GERENTE DE OPERACIONES"] },
  { departamento: "COMPRAS", puestos: ["JEFE DE COMPRAS"] },
  { departamento: "CONTABILIDAD", puestos: ["JEFE DE CONTABILIDAD", "ANALISTA CONTABLE"] },
  { departamento: "CREDITO Y COBRANZA", puestos: ["JEFE CRÉDITO Y COBRANZA"] },
  { departamento: "DIRECCION GENERAL", puestos: ["GERENTE COMERCIAL", "ADMINISTRACION", "GERENTE DE MARKETING"] },
  { departamento: "FACTURACION", puestos: ["SUPERVISOR DE FACTURACION"] },
  { departamento: "LOGISTICA", puestos: ["ANALISTA DE CUENTAS POR COBRAR", "AUXILIAR ADMINISTRATIVO DE LOGISTICA"] },
  { departamento: "MERCADOTECNIA", puestos: ["COORDINADORA DE DISEÑO"] },
  { departamento: "OPERACIONES", puestos: ["GERENTE DE OPERACIONES", "JEFE DE IMPORTACIONES Y REGULACIONES", "PLANEADOR", "JEFE DE ALMACEN"] },
  { departamento: "PROMOTORIA", puestos: ["COORDINADOR DE PROMOTORIA"] },
  { departamento: "VENTAS", puestos: ["CALL CENTER", "AGENTE DE VENTAS", "GERENTE DE VENTAS", "ANALISTA DE VENTAS", "SUBDIRECTOR COMERCIAL", "ANALISTA DE VENTAS ", "KAM (KEY ACCOUNT MANAGER)"] }
];

const jefesData = [
  "GARDUÑO SERVIN CRISTINA", 
  "SEVILLA KRAM ANDRES DANIEL", 
  "SEVILLA CHERES ARI", 
  "CABIEDES GRANADOS HILDA", 
  "SAN ROMAN LAGUNA CARLOS ISAAC", 
  "TANIA SEVILLA", 
  "GARCIA SANCHEZ DANIEL", 
  "CALLEJAS GARCIA ANA DELIA", 
  "ADRIAN SANCHEZ", 
  "ANDRES SEVILLA"
];

// Función para generar datos ficticios necesarios para empleados
function generarDatosFicticiosParaEmpleado(nombreCompleto, index) {
  // Separar nombre y apellidos
  const partes = nombreCompleto.split(' ');
  const nombres = partes.slice(0, -2).join(' ') || partes[0] || 'Nombre';
  const apellidoPaterno = partes[partes.length - 2] || 'ApellidoP';
  const apellidoMaterno = partes[partes.length - 1] || 'ApellidoM';
  
  // Generar identificadores únicos basados en el índice
  const numero = (index + 1).toString().padStart(3, '0');
  
  return {
    nombres: nombres,
    apellidoPaterno: apellidoPaterno,
    apellidoMaterno: apellidoMaterno,
    nombre: nombreCompleto,
    curp: `CURP${numero}${apellidoPaterno.substring(0, 2)}${apellidoMaterno.substring(0, 2)}${nombres.substring(0, 2)}`,
    nss: `123456789${numero}`,
    rfc: `RFC${numero}${apellidoPaterno.substring(0, 3)}${apellidoMaterno.substring(0, 1)}${nombres.substring(0, 1)}`,
    fechaAlta: new Date(),
    fechaNacimiento: new Date(1980 + (index % 20), index % 12, (index % 28) + 1),
    correoElectronico: `${nombres.toLowerCase().replace(/\s+/g, '.')}.${apellidoPaterno.toLowerCase()}@empresa.com`,
    telefonoMovil: `555123${numero}`,
    direccionCompleta: `Calle ${numero}, Colonia Centro, Ciudad`,
    estado: "Ciudad de México",
    cpFiscal: `0100${numero}`,
    estadoCivil: index % 2 === 0 ? "Soltero" : "Casado",
    sexo: index % 2 === 0 ? "Masculino" : "Femenino",
    nacionalidad: "Mexicana",
    lugarNacimiento: "Ciudad de México",
    nivelAcademico: "Licenciatura",
    horario: "Lunes a Viernes 9:00-18:00",
    contrato: "Indeterminado",
    area: "Administración",
    sucursal: "Matriz",
    region: "Centro",
    banco: "Banco Ejemplo",
    numeroCuenta: `1234567890${numero}`,
    clabe: `01218000123456789${numero}`,
    tallaCamisa: "M",
    tallaPantalon: "32",
    tallaPlayera: "M",
    tallaZapatos: "9",
    telefonoCasa: `555987${numero}`,
    salarioMensual: 25000 + (index * 1000),
    sd: 25000 + (index * 1000),
    sdi: 25000 + (index * 1000),
    clave: `EMP${numero}`,
    nivelJerarquico: "GERENTE"
  };
}

async function main() {
  console.log('🚀 Iniciando seed de estructura RH...\n');
  
  try {
    // 1. Insertar Departamentos
    console.log('📋 Insertando Departamentos...');
    const departamentosCreados = [];
    
    for (const deptoData of departamentosData) {
      const nombreDepartamento = deptoData.departamento;
      
      // Verificar si el departamento ya existe
      const departamentoExistente = await prisma.department.findUnique({
        where: { nombre: nombreDepartamento }
      });
      
      if (departamentoExistente) {
        console.log(`   ⏭️  Departamento "${nombreDepartamento}" ya existe, omitiendo...`);
        departamentosCreados.push(departamentoExistente);
      } else {
        const nuevoDepartamento = await prisma.department.create({
          data: {
            nombre: nombreDepartamento,
            descripcion: `Departamento de ${nombreDepartamento}`,
            estado: "Activo"
          }
        });
        console.log(`   ✅ Departamento "${nombreDepartamento}" creado (ID: ${nuevoDepartamento.id})`);
        departamentosCreados.push(nuevoDepartamento);
      }
    }
    
    console.log(`\n📊 Total departamentos procesados: ${departamentosCreados.length}\n`);
    
    // 2. Insertar Puestos por Departamento
    console.log('📋 Insertando Puestos por Departamento...');
    let totalPuestosCreados = 0;
    let totalPuestosOmitidos = 0;
    
    for (let i = 0; i < departamentosData.length; i++) {
      const deptoData = departamentosData[i];
      const departamento = departamentosCreados[i];
      
      console.log(`\n   📍 Departamento: ${deptoData.departamento}`);
      
      for (const nombrePuesto of deptoData.puestos) {
        // Verificar si el puesto ya existe en este departamento
        const puestoExistente = await prisma.jobPosition.findFirst({
          where: {
            nombre: nombrePuesto.trim(),
            departamentoId: departamento.id
          }
        });
        
        if (puestoExistente) {
          console.log(`      ⏭️  Puesto "${nombrePuesto.trim()}" ya existe en este departamento, omitiendo...`);
          totalPuestosOmitidos++;
        } else {
          // Determinar nivel jerárquico basado en el nombre del puesto
          let nivelJerarquico = "OPERATIVO";
          const puestoUpper = nombrePuesto.toUpperCase();
          
          if (puestoUpper.includes("GERENTE") || puestoUpper.includes("DIRECTOR") || puestoUpper.includes("SUBDIRECTOR")) {
            nivelJerarquico = "GERENTE";
          } else if (puestoUpper.includes("JEFE") || puestoUpper.includes("COORDINADOR") || puestoUpper.includes("SUPERVISOR")) {
            nivelJerarquico = "SUPERVISOR";
          } else if (puestoUpper.includes("ANALISTA") || puestoUpper.includes("ESPECIALISTA")) {
            nivelJerarquico = "COORDINADOR";
          }
          
          const nuevoPuesto = await prisma.jobPosition.create({
            data: {
              nombre: nombrePuesto.trim(),
              descripcion: `Puesto de ${nombrePuesto.trim()} en ${deptoData.departamento}`,
              nivelJerarquico: nivelJerarquico,
              estado: "Activo",
              departamentoId: departamento.id
            }
          });
          console.log(`      ✅ Puesto "${nombrePuesto.trim()}" creado (Nivel: ${nivelJerarquico})`);
          totalPuestosCreados++;
        }
      }
    }
    
    console.log(`\n📊 Resumen Puestos: ${totalPuestosCreados} creados, ${totalPuestosOmitidos} omitidos\n`);
    
    // 3. Insertar Jefes Directos como Empleados
    console.log('📋 Insertando Jefes Directos como Empleados...');
    let totalJefesCreados = 0;
    let totalJefesOmitidos = 0;
    
    // Necesitamos un departamento para asignar a los jefes
    // Usaremos el departamento de ADMINISTRACION (índice 0) o crearemos uno si no existe
    const departamentoAdmin = departamentosCreados.find(d => d.nombre === "ADMINISTRACION") || departamentosCreados[0];
    
    // También necesitamos un puesto para asignar
    const puestoGerente = await prisma.jobPosition.findFirst({
      where: {
        nombre: { contains: "GERENTE" },
        departamentoId: departamentoAdmin.id
      }
    });
    
    // Si no hay puesto gerente, creamos uno
    let puestoIdParaJefes = puestoGerente?.id;
    if (!puestoIdParaJefes) {
      const puestoDefault = await prisma.jobPosition.create({
        data: {
          nombre: "GERENTE GENERAL",
          descripcion: "Puesto gerencial para jefes directos",
          nivelJerarquico: "GERENTE",
          estado: "Activo",
          departamentoId: departamentoAdmin.id
        }
      });
      puestoIdParaJefes = puestoDefault.id;
      console.log(`   ℹ️  Puesto "GERENTE GENERAL" creado para jefes directos`);
    }
    
    for (let i = 0; i < jefesData.length; i++) {
      const nombreJefe = jefesData[i];
      
      // Verificar si ya existe un empleado con este nombre como jefeDirecto
      const empleadoExistente = await prisma.employee.findFirst({
        where: {
          OR: [
            { nombre: nombreJefe },
            { jefeDirecto: nombreJefe }
          ]
        }
      });
      
      if (empleadoExistente) {
        console.log(`   ⏭️  Jefe "${nombreJefe}" ya existe como empleado, omitiendo...`);
        totalJefesOmitidos++;
      } else {
        // Generar datos ficticios para los campos requeridos
        const datosFicticios = generarDatosFicticiosParaEmpleado(nombreJefe, i);
        
        const nuevoJefe = await prisma.employee.create({
          data: {
            ...datosFicticios,
            departamento_id: departamentoAdmin.id,
            puestoId: puestoIdParaJefes,
            jefeDirecto: nombreJefe, // También guardamos el nombre en el campo jefeDirecto
            estatus: "Activo"
          }
        });
        console.log(`   ✅ Jefe "${nombreJefe}" creado como empleado (ID: ${nuevoJefe.id})`);
        totalJefesCreados++;
      }
    }
    
    console.log(`\n📊 Resumen Jefes: ${totalJefesCreados} creados, ${totalJefesOmitidos} omitidos\n`);
    
    // 4. Resumen final
    console.log('🎉 Seed completado exitosamente!');
    console.log('========================================');
    console.log(`📈 Resumen final:`);
    console.log(`   • Departamentos: ${departamentosCreados.length} procesados`);
    console.log(`   • Puestos: ${totalPuestosCreados} creados, ${totalPuestosOmitidos} omitidos`);
    console.log(`   • Jefes Directos: ${totalJefesCreados} creados, ${totalJefesOmitidos} omitidos`);
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función principal
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error fatal:', e);
      process.exit(1);
    });
}

module.exports = { main };