const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const hrAudit = require('../services/hrAudit.service');

// Mismo criterio que Feature C (disciplina): RH/ADMIN o el jefe directo del empleado.
// El propio empleado NO puede ver su historial de auditoría desde este endpoint.
const canViewAudit = async (user, employeeId) => {
  if (user.role === 'ADMIN' || user.role === 'RH') return true;
  if (!user.employeeId) return false;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { reportaAId: true } });
  return !!employee && employee.reportaAId === user.employeeId;
};

class HrAuditController {
  static async getByEmployee(req, res) {
    try {
      const { id } = req.params;

      if (!(await canViewAudit(req.user, id))) {
        return res.status(403).json({ error: 'No tienes permisos para ver la auditoría de este empleado' });
      }

      const history = await hrAudit.getHistoryByEmployee(id);
      res.json({ data: history });
    } catch (error) {
      console.error('Error getting HR audit history:', error.message);
      res.status(500).json({ error: 'Error al obtener el historial de auditoría' });
    }
  }
}

module.exports = HrAuditController;
