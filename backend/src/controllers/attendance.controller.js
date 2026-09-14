const { PrismaClient } = require('@prisma/client');
const csv = require('csv-parser');
const multer = require('multer');
const { parseZKTecoDate, buildDateFilter } = require('../utils/attendance.utils');

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
      let totalRows = 0;
      let invalidDateRows = 0;
      let errorRows = 0;

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
            totalRows++;
            try {
              // Parse the date using the exact function provided
              const fechaHora = parseZKTecoDate(row.tiempo);

              if (!fechaHora) {
                invalidDateRows++;
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
              errorRows++;
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

      const rowsDropped = invalidDateRows + errorRows;

      if (records.length === 0) {
        return res.status(400).json({
          success: false,
          message: `El archivo CSV no contiene registros válidos (${totalRows} fila(s) leída(s), todas descartadas: ${invalidDateRows} con fecha inválida, ${errorRows} con error de formato).`
        });
      }

      // Save records to database using createMany
      const result = await prisma.attendanceRecord.createMany({
        data: records,
        skipDuplicates: true // Skip duplicates based on unique constraint if any
      });

      const message = rowsDropped > 0
        ? `CSV procesado. ${result.count} registros guardados, ${rowsDropped} fila(s) descartada(s) de ${totalRows} leídas (${invalidDateRows} con fecha inválida, ${errorRows} con error de formato).`
        : `CSV procesado exitosamente. ${result.count} registros guardados en la base de datos.`;

      return res.status(200).json({
        success: true,
        message,
        data: {
          rowsInFile: totalRows,
          recordsProcessed: records.length,
          recordsSaved: result.count,
          rowsDropped,
          invalidDateRows,
          errorRows
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
      const { valid, filter } = buildDateFilter(startDate, endDate);

      if (!valid) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Use formato ISO (YYYY-MM-DD)'
        });
      }

      const records = await prisma.attendanceRecord.findMany({
        where: filter,
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

  /**
   * Get the authenticated user's own attendance records by date range.
   * Matches AttendanceRecord.numeroEmpleado (el número del checador) contra
   * Employee.clave — mismo identificador que usa la importación de CSV.
   */
  static async getMyRecords(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren las fechas de inicio y fin (startDate, endDate)'
        });
      }

      const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      if (!employee || !employee.clave) {
        return res.status(404).json({
          success: false,
          message: 'No tienes un expediente de empleado con clave asignada, no se puede buscar tu asistencia'
        });
      }

      const { valid, filter } = buildDateFilter(startDate, endDate);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Use formato ISO (YYYY-MM-DD)'
        });
      }

      const records = await prisma.attendanceRecord.findMany({
        where: { ...filter, numeroEmpleado: employee.clave },
        orderBy: { fechaHora: 'asc' },
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
      console.error('Error en getMyRecords:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener tu asistencia',
        error: error.message
      });
    }
  }

}

module.exports = {
  AttendanceController,
  upload
};