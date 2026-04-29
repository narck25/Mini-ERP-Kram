const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const depts = await prisma.department.findMany({ 
      include: { 
        jobPositions: {
          where: { estado: 'Activo' }
        } 
      } 
    });
    
    console.log('Departamentos y puestos activos:');
    console.log('================================');
    
    depts.forEach(d => {
      console.log(`- ${d.nombre} (${d.estado}): ${d.jobPositions.length} puestos activos`);
      d.jobPositions.forEach(p => {
        console.log(`  * ${p.nombre} (${p.nivelJerarquico}) - ID: ${p.id}`);
      });
    });
    
    console.log('\nTotal de departamentos:', depts.length);
    console.log('Total de puestos activos:', depts.reduce((sum, d) => sum + d.jobPositions.length, 0));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();