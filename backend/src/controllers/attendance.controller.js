const { PrismaClient } = require('@prisma/client');
const csv = require('csv-parser');
const multer = require('multer');

const prisma = new PrismaClient();

// Configure multer for memory storage (as requested)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'), false);
    }
  }
});

/**
 * LÓGICA CRÍTICA DE FECHAS: El CSV viene con el header "Tiempo" y valores como "25/02/2026 08:26:17 a. m."
 * Usa esta lógica exacta para convertirlo antes de guardarlo en Prisma
 */
function parseZKTecoDate(dateStr) {
  // Espera formato: "25/02/2026 08:26:17 a. m." o "p. m."
  const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2}) (a\. m\.|p\. m\.)/);
  if (!parts) return new Date();
  let [_, day, month, year, hours, minutes, seconds, ampm] = parts;
  hours = parseInt(hours);
  if (ampm === 'p. m.' && hours < 12) hours += 12;
  if (ampm === 'a. m.' && hours === 12) hours = 0;
  return new Date(`${year}-${month}-${day}T${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`);
}

class AttendanceController {
  /**
   * Upload and process CSV file from ZKTeco checador
   */
  static async uploadCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ningún archivo CSV'
        });
      }

      const records = [];

      // Read and parse CSV file from memory buffer
      await new Promise((resolve, reject) => {
        const bufferStream = require('stream').Readable.from(req.file.buffer);
        
        bufferStream
          .pipe(csv({
            separator: ',',
            headers: ['numeroEmpleado', 'nombreEmpleado', 'tiempo', 'estado', 'dispositivo', 'tipoRegistro'],
            skipLines: 1 // Skip header row
          }))
          .on('data', (row) => {
            try {
              // Parse the date using the exact function provided
              const fechaHora = parseZKTecoDate(row.tiempo);
              
              if (!fechaHora) {
                console.warn(`Fecha inválida en registro: ${JSON.stringify(row)}`);
                return;
              }

              records.push({
                numeroEmpleado: row.numeroEmpleado?.toString() || '',
                nombreEmpleado: row.nombreEmpleado || '',
                fechaHora: fechaHora,
                tipo: row.estado || 'Entrada',
                dispositivo: row.dispositivo || null
              });
            } catch (error) {
              console.error(`Error procesando fila: ${error.message}`, row);
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      if (records.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El archivo CSV no contiene registros válidos'
        });
      }

      // Save records to database using createMany
      const result = await prisma.attendanceRecord.createMany({
        data: records,
        skipDuplicates: true // Skip duplicates based on unique constraint if any
      });

      return res.status(200).json({
        success: true,
        message: `CSV procesado exitosamente. ${result.count} registros guardados en la base de datos.`,
        data: {
          recordsProcessed: records.length,
          recordsSaved: result.count
        }
      });

    } catch (error) {
      console.error('Error en uploadCSV:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error al procesar el archivo CSV',
        error: error.message
      });
    }
  }

  /**
   * Get attendance records by date range
   */
  static async getRecords(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren las fechas de inicio y fin (startDate, endDate)'
        });
      }

      // Obtener los parámetros
      let dateFilter = {};
      
      if (startDate && endDate) {
        // Al concatenar 'T00:00:00' Node lo interpreta en la zona horaria local del servidor
        const start = new Date(`${startDate}T00:00:00.000`);
        const end = new Date(`${endDate}T23:59:59.999`);
        
        // Validar que las fechas sean válidas
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Formato de fecha inválido. Use formato ISO (YYYY-MM-DD)'
          });
        }
        
        dateFilter = {
          fechaHora: {
            gte: start,
            lte: end
          }
        };
      }

      const records = await prisma.attendanceRecord.findMany({
        where: dateFilter,
        orderBy: {
          fechaHora: 'asc'
        },
        select: {
          id: true,
          numeroEmpleado: true,
          nombreEmpleado: true,
          fechaHora: true,
          tipo: true,
          dispositivo: true,
          createdAt: true
        }
      });

      return res.status(200).json({
        success: true,
        message: `Se encontraron ${records.length} registros`,
        data: records
      });

    } catch (error) {
      console.error('Error en getRecords:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener registros de asistencia',
        error: error.message
      });
    }
  }

}

module.exports = {
  AttendanceController,
  upload
};