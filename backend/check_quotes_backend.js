const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQuotes() {
  try {
    const quotes = await prisma.purchaseQuote.findMany({
      include: {
        request: {
          select: {
            id: true,
            estatus: true
          }
        }
      },
      orderBy: { fechaCotizacion: 'desc' },
      take: 10
    });
    
    console.log('Últimas 10 cotizaciones:');
    quotes.forEach((quote, index) => {
      console.log(`${index + 1}. ID: ${quote.id}`);
      console.log(`   Proveedor: ${quote.proveedor}`);
      console.log(`   Monto: ${quote.monto}`);
      console.log(`   Archivo URL: ${quote.archivoUrl}`);
      console.log(`   Solicitud ID: ${quote.requestId} (Estado: ${quote.request.estatus})`);
      console.log(`   Creado: ${quote.createdAt}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuotes();