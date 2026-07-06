const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const employeeCrud = require('./employee-crud.controller');

// ─── Re-exports desde employee-crud.controller.js ───
exports.getAllEmployees = employeeCrud.getAllEmployees;
exports.getCurrentEmployee = employeeCrud.getCurrentEmployee;
exports.getEmployeeById = employeeCrud.getEmployeeById;
exports.createEmployee = employeeCrud.createEmployee;
exports.updateEmployee = employeeCrud.updateEmployee;

// ─── Funciones específicas de employee-core ───

exports.getSalaryHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({ where: { id }, select: { id: true, nombre: true } });
    if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' });
    const salaryHistory = await prisma.salaryHistory.findMany({ where: { employeeId: id }, orderBy: { fechaCambio: 'desc' }, include: { empleado: { select: { nombre: true } } } });
    res.json({ salaryHistory, employee });
  } catch (error) {
    console.error('Error fetching salary history:', error);
    res.status(500).json({ error: 'Error al obtener el historial de sueldos' });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const e = await prisma.employee.findUnique({ where: { id }, include: { user: { select: { id: true, isActive: true } } } });
    if (!e) return res.status(404).json({ error: 'Empleado no encontrado' });
    const emp = await prisma.employee.update({ where: { id }, data: { estatus: 'Inactivo' } });
    let userDeactivated = false;
    if (e.user) { await prisma.user.update({ where: { id: e.user.id }, data: { isActive: false } }); userDeactivated = true; }
    res.json({ msg: 'Empleado dado de baja exitosamente', employee: emp, userDeactivated });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Error al dar de baja al empleado' });
  }
};

exports.deleteEmployeePermanently = async (req, res) => {
  try {
    const { id } = req.params;
    const e = await prisma.employee.findUnique({ where: { id }, include: { user: { select: { id: true, email: true, name: true } } } });
    if (!e) return res.status(404).json({ error: 'Empleado no encontrado' });
    const docs = await prisma.employeeDocument.count({ where: { employee_id: id } });
    const vacs = await prisma.jobVacancy.count({ where: { OR: [{ solicitanteId: id }, { autorizadoPorId: id }, { voBoPorId: id }] } });
    if (docs > 0 || vacs > 0) return res.status(400).json({ error: 'No se puede eliminar permanentemente', details: { documentsCount: docs, jobVacanciesCount: vacs } });
    let userDeleted = false, userInfo = null;
    if (e.user) { await prisma.user.delete({ where: { id: e.user.id } }); userDeleted = true; userInfo = { id: e.user.id, email: e.user.email, name: e.user.name }; }
    await prisma.employee.delete({ where: { id } });
    res.json({ message: 'Empleado eliminado permanentemente', deletedEmployee: { id: e.id, nombre: e.nombre, rfc: e.rfc }, userDeleted, userInfo });
  } catch (error) {
    console.error('Error deleting permanently:', error);
    res.status(500).json({ error: 'Error al eliminar el empleado permanentemente' });
  }
};
