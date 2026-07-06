const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllDepartments = async (req, res) => {
  try { const depts = await prisma.department.findMany({ orderBy: { nombre: 'asc' } }); res.json({ departments: depts }); }
  catch (error) { console.error('Error getting departments:', error); res.status(500).json({ error: 'Error al obtener departamentos' }); }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const dept = await prisma.department.findUnique({ where: { id: req.params.id }, include: { employees: { select: { id: true, nombre: true } }, jobPositions: true } });
    if (!dept) return res.status(404).json({ error: 'Departamento no encontrado' });
    res.json({ department: dept });
  } catch (error) { console.error('Error getting department:', error); res.status(500).json({ error: 'Error al obtener departamento' }); }
};

exports.createDepartment = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
    const dept = await prisma.department.create({ data: { nombre, descripcion } });
    res.status(201).json({ department: dept, message: 'Departamento creado' });
  } catch (error) { if (error.code === 'P2002') return res.status(400).json({ error: 'Ya existe un departamento con ese nombre' }); console.error('Error creating department:', error); res.status(500).json({ error: 'Error al crear departamento' }); }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const dept = await prisma.department.update({ where: { id: req.params.id }, data: { nombre, descripcion } });
    res.json({ department: dept, message: 'Departamento actualizado' });
  } catch (error) { console.error('Error updating department:', error); res.status(500).json({ error: 'Error al actualizar departamento' }); }
};

exports.deleteDepartment = async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ message: 'Departamento eliminado' });
  } catch (error) { console.error('Error deleting department:', error); res.status(500).json({ error: 'Error al eliminar departamento' }); }
};

exports.getJobPositionsByDepartment = async (req, res) => {
  try {
    const positions = await prisma.jobPosition.findMany({ where: { departamentoId: req.params.departmentId, estado: 'Activo' }, orderBy: { nombre: 'asc' } });
    res.json({ positions });
  } catch (error) { console.error('Error getting positions by department:', error); res.status(500).json({ error: 'Error al obtener puestos' }); }
};