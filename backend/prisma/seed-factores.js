/**
 * Seed para poblar la tabla de Factores de Integración
 * Datos extraídos del archivo Td_factor_integracion.xlsx
 * 
 * Ejecutar: node prisma/seed-factores.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const factores = [
  { anio: 1,  diasAguinaldo: 15, diasVacaciones: 12, primaVacacional: 0.25, factor: 1.0493 },
  { anio: 2,  diasAguinaldo: 15, diasVacaciones: 14, primaVacacional: 0.25, factor: 1.0507 },
  { anio: 3,  diasAguinaldo: 15, diasVacaciones: 16, primaVacacional: 0.25, factor: 1.0521 },
  { anio: 4,  diasAguinaldo: 15, diasVacaciones: 18, primaVacacional: 0.25, factor: 1.0534 },
  { anio: 5,  diasAguinaldo: 15, diasVacaciones: 20, primaVacacional: 0.25, factor: 1.0548 },
  { anio: 6,  diasAguinaldo: 15, diasVacaciones: 22, primaVacacional: 0.25, factor: 1.0562 },
  { anio: 7,  diasAguinaldo: 15, diasVacaciones: 22, primaVacacional: 0.25, factor: 1.0562 },
  { anio: 8,  diasAguinaldo: 15, diasVacaciones: 22, primaVacacional: 0.25, factor: 1.0562 },
  { anio: 9,  diasAguinaldo: 15, diasVacaciones: 22, primaVacacional: 0.25, factor: 1.0562 },
  { anio: 10, diasAguinaldo: 15, diasVacaciones: 22, primaVacacional: 0.25, factor: 1.0562 },
  { anio: 11, diasAguinaldo: 15, diasVacaciones: 24, primaVacacional: 0.25, factor: 1.0575 },
  { anio: 12, diasAguinaldo: 15, diasVacaciones: 24, primaVacacional: 0.25, factor: 1.0575 },
  { anio: 13, diasAguinaldo: 15, diasVacaciones: 24, primaVacacional: 0.25, factor: 1.0575 },
  { anio: 14, diasAguinaldo: 15, diasVacaciones: 24, primaVacacional: 0.25, factor: 1.0575 },
  { anio: 15, diasAguinaldo: 15, diasVacaciones: 24, primaVacacional: 0.25, factor: 1.0575 },
  { anio: 16, diasAguinaldo: 15, diasVacaciones: 26, primaVacacional: 0.25, factor: 1.0589 },
  { anio: 17, diasAguinaldo: 15, diasVacaciones: 26, primaVacacional: 0.25, factor: 1.0589 },
  { anio: 18, diasAguinaldo: 15, diasVacaciones: 26, primaVacacional: 0.25, factor: 1.0589 },
  { anio: 19, diasAguinaldo: 15, diasVacaciones: 26, primaVacacional: 0.25, factor: 1.0589 },
  { anio: 20, diasAguinaldo: 15, diasVacaciones: 26, primaVacacional: 0.25, factor: 1.0589 },
  { anio: 21, diasAguinaldo: 15, diasVacaciones: 28, primaVacacional: 0.25, factor: 1.0603 },
  { anio: 22, diasAguinaldo: 15, diasVacaciones: 28, primaVacacional: 0.25, factor: 1.0603 },
  { anio: 23, diasAguinaldo: 15, diasVacaciones: 28, primaVacacional: 0.25, factor: 1.0603 },
  { anio: 24, diasAguinaldo: 15, diasVacaciones: 28, primaVacacional: 0.25, factor: 1.0603 },
  { anio: 25, diasAguinaldo: 15, diasVacaciones: 28, primaVacacional: 0.25, factor: 1.0603 },
  { anio: 26, diasAguinaldo: 15, diasVacaciones: 30, primaVacacional: 0.25, factor: 1.0616 },
  { anio: 27, diasAguinaldo: 15, diasVacaciones: 30, primaVacacional: 0.25, factor: 1.0616 },
  { anio: 28, diasAguinaldo: 15, diasVacaciones: 30, primaVacacional: 0.25, factor: 1.0616 },
  { anio: 29, diasAguinaldo: 15, diasVacaciones: 30, primaVacacional: 0.25, factor: 1.0616 },
  { anio: 30, diasAguinaldo: 15, diasVacaciones: 30, primaVacacional: 0.25, factor: 1.0616 },
];

async function seedFactores() {
  console.log('🌱 Sembrando factores de integración...\n');

  for (const f of factores) {
    const existing = await prisma.factorIntegracion.findUnique({
      where: { anio: f.anio }
    });

    if (existing) {
      await prisma.factorIntegracion.update({
        where: { anio: f.anio },
        data: f
      });
      console.log(`  ✅ Año ${f.anio} actualizado (factor: ${f.factor})`);
    } else {
      await prisma.factorIntegracion.create({ data: f });
      console.log(`  ✅ Año ${f.anio} creado (factor: ${f.factor})`);
    }
  }

  console.log('\n✅ Seed completado: 30 factores de integración insertados/actualizados');
  await prisma.$disconnect();
}

seedFactores().catch(e => {
  console.error('❌ Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
