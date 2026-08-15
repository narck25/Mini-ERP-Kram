/**
 * seed-datos-ejemplo.js
 * Datos de ejemplo para DEMO del ERP KRAM: papelería, uniformes,
 * compras y empleados con jerarquía. Ejecutar: node prisma/seed-datos-ejemplo.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos de ejemplo para demo...\n');

  // 1. INVENTARIO DE PAPELERÍA (idempotente)
  const stationeryInventory = [
    { producto: 'Pluma BIC azul', categoria: 'PAPELERIA', cantidadActual: 200, cantidadMinima: 50, unidad: 'pzas' },
    { producto: 'Pluma BIC negra', categoria: 'PAPELERIA', cantidadActual: 150, cantidadMinima: 50, unidad: 'pzas' },
    { producto: 'Cuaderno profesional', categoria: 'PAPELERIA', cantidadActual: 80, cantidadMinima: 20, unidad: 'pzas' },
    { producto: 'Folder tamaño carta', categoria: 'PAPELERIA', cantidadActual: 300, cantidadMinima: 100, unidad: 'pzas' },
    { producto: 'Post-it amarillo', categoria: 'PAPELERIA', cantidadActual: 60, cantidadMinima: 15, unidad: 'pzas' },
    { producto: 'Cinta adhesiva', categoria: 'PAPELERIA', cantidadActual: 40, cantidadMinima: 10, unidad: 'rollos' },
    { producto: 'Toner HP LaserJet', categoria: 'PERIFERICO', cantidadActual: 12, cantidadMinima: 4, unidad: 'pzas' },
    { producto: 'Mouse inalámbrico', categoria: 'PERIFERICO', cantidadActual: 25, cantidadMinima: 8, unidad: 'pzas' },
    { producto: 'Teclado USB', categoria: 'PERIFERICO', cantidadActual: 18, cantidadMinima: 6, unidad: 'pzas' },
    { producto: 'Resaltador amarillo', categoria: 'PAPELERIA', cantidadActual: 90, cantidadMinima: 30, unidad: 'pzas' }
  ];
  const sInv = await prisma.stationeryInventory.createMany({ data: stationeryInventory, skipDuplicates: true });
  console.log(`📄 Papelería inventario: ${sInv.count} nuevos`);

  // 2. INVENTARIO DE UNIFORMES (idempotente)
  const uniformInventory = [
    { tipo: 'CAMISA', talla: 'M', genero: 'HOMBRE', cantidadActual: 30, cantidadMinima: 5 },
    { tipo: 'CAMISA', talla: 'L', genero: 'HOMBRE', cantidadActual: 25, cantidadMinima: 5 },
    { tipo: 'CAMISA', talla: 'M', genero: 'MUJER', cantidadActual: 20, cantidadMinima: 5 },
    { tipo: 'PANTALON', talla: '32', genero: 'HOMBRE', cantidadActual: 28, cantidadMinima: 5 },
    { tipo: 'PANTALON', talla: '34', genero: 'HOMBRE', cantidadActual: 22, cantidadMinima: 5 },
    { tipo: 'PLAYERA', talla: 'M', genero: 'UNISEX', cantidadActual: 40, cantidadMinima: 8 },
    { tipo: 'PLAYERA', talla: 'L', genero: 'UNISEX', cantidadActual: 35, cantidadMinima: 8 },
    { tipo: 'ZAPATOS', talla: '26', genero: 'HOMBRE', cantidadActual: 15, cantidadMinima: 3 },
    { tipo: 'ZAPATOS', talla: '25', genero: 'MUJER', cantidadActual: 12, cantidadMinima: 3 },
    { tipo: 'CHALECO', talla: 'M', genero: 'UNISEX', cantidadActual: 20, cantidadMinima: 4 },
    { tipo: 'GORRA', talla: 'UNICA', genero: 'UNISEX', cantidadActual: 50, cantidadMinima: 10 },
    { tipo: 'MANDIL', talla: 'M', genero: 'UNISEX', cantidadActual: 15, cantidadMinima: 3 }
  ];
  const uInv = await prisma.uniformInventory.createMany({ data: uniformInventory, skipDuplicates: true });
  console.log(`👕 Uniformes inventario: ${uInv.count} nuevos`);

  // Helpers de búsqueda
  const depto = (nombre) => prisma.department.findFirst({ where: { nombre } });
  const emp = (nombre) => prisma.employee.findFirst({ where: { nombre } });

  // 3. EMPLEADOS DE NIVELES BAJOS (completa la pirámide jerárquica)
  console.log('\n👥 Completando jerarquía de empleados...');
  const nuevoEmpleado = async (data) => {
    const existente = await prisma.employee.findFirst({ where: { rfc: data.rfc } });
    if (existente) return existente;
    return prisma.employee.create({ data });
  };

  const jefeAlmacen = await emp('ADRIAN SANCHEZ GOMEZ');
  const jefeCompras = await emp('JOSE LUIS GONZALEZ GUILLEN');
  const jefeLogistica = await emp('CARLOS IVAN ARANDIA REYNAGA');
  const dirRH = await emp('ELIZABETH ZURITA LUNA');
  const gerenteComercial = await emp('ADRIANA ARREDONDO SILVA');

  const deptoAlmacen = await depto('ALMACEN');
  const deptoCompras = await depto('COMPRAS');
  const deptoLogistica = await depto('LOGISTICA');
  const deptoRH = await depto('RECURSOS HUMANOS');
  const deptoComercial = await depto('COMERCIAL');

  const nuevosEmpleados = [
    {
      nombre: 'JUAN CARLOS PEREZ HERNANDEZ', nombres: 'Juan Carlos',
      apellidoPaterno: 'Perez', apellidoMaterno: 'Hernandez',
      curp: 'PEHJ900101HDFRRN01', rfc: 'PEHJ900101ABC', nss: '61987654321',
      clave: '7001', salarioMensual: 10500,
      departamento_id: deptoAlmacen.id, nivelJerarquico: 'OPERATIVO',
      reportaAId: jefeAlmacen.id, fechaAlta: new Date('2026-05-01'), estatus: 'Activo'
    },
    {
      nombre: 'MARIA FERNANDA LOPEZ GARCIA', nombres: 'Maria Fernanda',
      apellidoPaterno: 'Lopez', apellidoMaterno: 'Garcia',
      curp: 'LOGF910202MDFRGR02', rfc: 'LOGF910202XYZ', nss: '62987654322',
      clave: '7002', salarioMensual: 14500,
      departamento_id: deptoCompras.id, nivelJerarquico: 'ANALISTA',
      reportaAId: jefeCompras.id, fechaAlta: new Date('2026-04-15'), estatus: 'Activo'
    },
    {
      nombre: 'LUIS ALBERTO MARTINEZ DIAZ', nombres: 'Luis Alberto',
      apellidoPaterno: 'Martinez', apellidoMaterno: 'Diaz',
      curp: 'MADL880303HDFRDR03', rfc: 'MADL880303QRS', nss: '63987654323',
      clave: '7003', salarioMensual: 16500,
      departamento_id: deptoLogistica.id, nivelJerarquico: 'SUPERVISOR',
      reportaAId: jefeLogistica.id, fechaAlta: new Date('2026-03-20'), estatus: 'Activo'
    },
    {
      nombre: 'ANA LAURA TORRES RUIZ', nombres: 'Ana Laura',
      apellidoPaterno: 'Torres', apellidoMaterno: 'Ruiz',
      curp: 'TORA920404MDFRUR04', rfc: 'TORA920404TUV', nss: '64987654324',
      clave: '7004', salarioMensual: 12500,
      departamento_id: deptoRH.id, nivelJerarquico: 'AUX_ADMINISTRATIVO',
      reportaAId: dirRH.id, fechaAlta: new Date('2026-06-01'), estatus: 'Activo'
    }
  ];
  for (const e of nuevosEmpleados) {
    await nuevoEmpleado(e);
    console.log(`   ✅ ${e.nombre} (${e.nivelJerarquico})`);
  }

  // 4. SOLICITUDES DE PAPELERÍA
  console.log('\n📄 Creando solicitudes de papelería...');
  const solicitudesPapeleria = [
    { solicitante: jefeCompras, depto: deptoCompras, estatus: 'PENDIENTE', justificacion: 'Reposición mensual de material de oficina',
      items: [{ producto: 'Pluma BIC azul', cantidad: 20 }, { producto: 'Folder tamaño carta', cantidad: 50 }] },
    { solicitante: jefeAlmacen, depto: deptoAlmacen, estatus: 'ENTREGADO', justificacion: 'Etiquetas y cinta para empaque de almacén',
      items: [{ producto: 'Cinta adhesiva', cantidad: 5, unidad: 'rollos' }] },
    { solicitante: jefeLogistica, depto: deptoLogistica, estatus: 'PENDIENTE', justificacion: 'Material para guías de embarque',
      items: [{ producto: 'Resaltador amarillo', cantidad: 10 }, { producto: 'Post-it amarillo', cantidad: 12 }] },
    { solicitante: gerenteComercial, depto: deptoComercial, estatus: 'CANCELADO', justificacion: 'Cuadernos para capacitación de ventas (cancelada)',
      items: [{ producto: 'Cuaderno profesional', cantidad: 15 }] },
    { solicitante: dirRH, depto: deptoRH, estatus: 'PENDIENTE', justificacion: 'Insumos para onboarding de nuevo personal',
      items: [{ producto: 'Pluma BIC negra', cantidad: 30 }, { producto: 'Cuaderno profesional', cantidad: 10 }] }
  ];
  for (const s of solicitudesPapeleria) {
    await prisma.stationeryRequest.create({
      data: {
        solicitanteId: s.solicitante.id,
        departamentoId: s.depto.id,
        estatus: s.estatus,
        justificacion: s.justificacion,
        fechaSolicitud: new Date('2026-08-01'),
        ...(s.estatus === 'ENTREGADO' ? { fechaEntrega: new Date('2026-08-04'), entregadoPorId: dirRH.id } : {}),
        items: { create: s.items }
      }
    });
    console.log(`   ✅ Papelería [${s.estatus}] - ${s.solicitante.nombre}`);
  }

  // 5. ENTREGAS DE UNIFORMES
  console.log('\n👕 Creando entregas de uniformes...');
  const entregasUniformes = [
    { empleado: await emp('JUAN CARLOS PEREZ HERNANDEZ'),
      items: [{ tipo: 'CAMISA', talla: 'M', genero: 'HOMBRE', cantidad: 2 }, { tipo: 'PANTALON', talla: '32', genero: 'HOMBRE', cantidad: 2 }],
      observaciones: 'Dotación inicial de uniforme' },
    { empleado: await emp('MARIA FERNANDA LOPEZ GARCIA'),
      items: [{ tipo: 'CAMISA', talla: 'M', genero: 'MUJER', cantidad: 2 }, { tipo: 'ZAPATOS', talla: '25', genero: 'MUJER', cantidad: 1 }],
      observaciones: 'Dotación inicial de uniforme' },
    { empleado: await emp('LUIS ALBERTO MARTINEZ DIAZ'),
      items: [{ tipo: 'PLAYERA', talla: 'L', genero: 'UNISEX', cantidad: 3 }, { tipo: 'CHALECO', talla: 'M', genero: 'UNISEX', cantidad: 1 }],
      observaciones: 'Reposición de chaleco' },
    { empleado: jefeAlmacen,
      items: [{ tipo: 'CAMISA', talla: 'L', genero: 'HOMBRE', cantidad: 2 }, { tipo: 'GORRA', talla: 'UNICA', genero: 'UNISEX', cantidad: 1 }],
      observaciones: 'Uniforme de jefe de almacén' }
  ];
  for (const e of entregasUniformes) {
    await prisma.uniformDelivery.create({
      data: {
        empleadoId: e.empleado.id,
        items: e.items,
        entregadoPorId: dirRH.id,
        fechaEntrega: new Date('2026-08-05'),
        observaciones: e.observaciones
      }
    });
    console.log(`   ✅ Entrega uniforme → ${e.empleado.nombre}`);
  }

  // 6. SOLICITUDES DE COMPRA (distintos departamentos/estados)
  console.log('\n🛒 Creando solicitudes de compra...');
  const solicitudesCompra = [
    { solicitante: jefeCompras, estatus: 'APROBADO', fecha: new Date('2026-07-10'),
      justificacion: 'Renovación de laptops para el área de sistemas',
      items: [
        { productoServicio: 'Laptop Dell Latitude 5440', cantidad: 5, descripcion: 'i7, 16GB RAM, 512GB SSD' },
        { productoServicio: 'Monitor Dell 24"', cantidad: 5, descripcion: 'Full HD' }
      ] },
    { solicitante: jefeAlmacen, estatus: 'PENDIENTE', fecha: new Date('2026-07-20'),
      justificacion: 'Equipo para optimizar el almacén',
      items: [{ productoServicio: 'Montacargas manual', cantidad: 2, descripcion: 'Capacidad 2 toneladas' }] },
    { solicitante: jefeLogistica, estatus: 'EN_AUTORIZACION', fecha: new Date('2026-07-25'),
      justificacion: 'Uniformes para choferes de reparto',
      items: [{ productoServicio: 'Chaleco reflejante', cantidad: 15, descripcion: 'Talla estándar' }] },
    { solicitante: gerenteComercial, estatus: 'NUEVO', fecha: new Date('2026-08-01'),
      justificacion: 'Material promocional para campaña de ventas',
      items: [{ productoServicio: 'Plumas personalizadas', cantidad: 500, descripcion: 'Con logo KRAM' }] }
  ];
  for (const s of solicitudesCompra) {
    await prisma.purchaseRequest.create({
      data: {
        solicitanteId: s.solicitante.id,
        departamentoId: s.solicitante.departamento_id,
        estatus: s.estatus,
        justificacion: s.justificacion,
        fechaSolicitud: s.fecha,
        requiereAutorizacion: s.estatus === 'EN_AUTORIZACION',
        items: { create: s.items }
      }
    });
    console.log(`   ✅ Compra [${s.estatus}] - ${s.solicitante.nombre}`);
  }

  console.log('\n✅ Datos de ejemplo creados exitosamente.');
  console.log('   Revisa en el frontend:');
  console.log('   - /dashboard/compras            (solicitudes de compra)');
  console.log('   - /compras/papeleria            (mis solicitudes de papelería)');
  console.log('   - /dashboard/compras/papeleria  (gestión de papelería)');
  console.log('   - /dashboard/compras/uniformes  (inventario y entregas de uniformes)');
  console.log('   - /rh/empleados                 (empleados con jerarquía)');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
