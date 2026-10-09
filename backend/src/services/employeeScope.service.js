const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Resuelve a qué empleados puede ver un usuario, según la cadena real de
 * reporte (Employee.reportaAId), no el departamento — dos jefes distintos
 * pueden compartir departamento sin que uno deba ver al equipo del otro.
 *
 * @param {Object} user - req.user (requiere role, employeeId)
 * @returns {Promise<string[]|null>} null = sin restricción (ADMIN/RH); si no,
 *   array de ids de Employee visibles (incluye siempre al propio usuario).
 */
async function getScopedEmployeeIds(user) {
  if (user.role === 'ADMIN' || user.role === 'RH') return null;
  if (!user.employeeId) return [];

  const all = await prisma.employee.findMany({ select: { id: true, reportaAId: true } });
  const childrenMap = new Map();
  for (const e of all) {
    if (!e.reportaAId) continue;
    if (!childrenMap.has(e.reportaAId)) childrenMap.set(e.reportaAId, []);
    childrenMap.get(e.reportaAId).push(e.id);
  }

  const scoped = new Set([user.employeeId]);
  const queue = [user.employeeId];
  while (queue.length) {
    const current = queue.shift();
    for (const childId of (childrenMap.get(current) || [])) {
      if (!scoped.has(childId)) {
        scoped.add(childId);
        queue.push(childId);
      }
    }
  }
  return Array.from(scoped);
}

module.exports = { getScopedEmployeeIds };
