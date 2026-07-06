const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllJobPositions = async (req, res) => {
  try {
    const positions = await prisma.jobPosition.findMany({
      include: { departamento: { select: { id: true, nombre: true } } },
      orderBy: { nombre: 'asc' }
    });
    res.json({ positions });
  } catch (error) { console.error('Error getting positions:', error); res.status(500).json({ error: 'Error al obtener puestos' }); }
};

exports.getJobPositionById = async (req, res) => {
  try {
    const pos = await prisma.jobPosition.findUnique({ where: { id: req.params.id }, include: { departamento: true, employees: { select: { id: true, nombre: true } } } });
    if (!pos) return res.status(404).json({ error: 'Puesto no encontrado' });
    res.json({ position: pos });
  } catch (error) { console.error('Error getting position:', error); res.status(500).json({ error: 'Error al obtener puesto' }); }
};

exports.createJobPosition = async (req, res) => {
  try {
    const { nombre, descripcion, nivelJerarquico, departamentoId } = req.body;
    if (!nombre || !departamentoId) return res.status(400).json({ error: 'Nombre y departamentoId son requeridos' });
    const pos = await prisma.jobPosition.create({ data: { nombre, descripcion, nivelJerarquico: nivelJerarquico || 'OPERATIVO', departamentoId } });
    res.status(201).json({ position: pos, message: 'Puesto creado' });
  } catch (error) { console.error('Error creating position:', error); res.status(500).json({ error: 'Error al crear puesto' }); }
};

exports.updateJobPosition = async (req, res) => {
  try {
    const { nombre, descripcion, nivelJerarquico, departamentoId } = req.body;
    const pos = await prisma.jobPosition.update({ where: { id: req.params.id }, data: { nombre, descripcion, nivelJerarquico, departamentoId } });
    res.json({ position: pos, message: 'Puesto actualizado' });
  } catch (error) { console.error('Error updating position:', error); res.status(500).json({ error: 'Error al actualizar puesto' }); }
};

exports.deleteJobPosition = async (req, res) => {
  try {
    await prisma.jobPosition.delete({ where: { id: req.params.id } });
    res.json({ message: 'Puesto eliminado' });
  } catch (error) { console.error('Error deleting position:', error); res.status(500).json({ error: 'Error al eliminar puesto' }); }
};

exports.getOrganizationStats = async (req, res) => {
  try {
    const [deptCount, posCount, empCount] = await Promise.all([
      prisma.department.count({ where: { estado: 'Activo' } }),
      prisma.jobPosition.count({ where: { estado: 'Activo' } }),
      prisma.employee.count({ where: { estatus: 'Activo' } })
    ]);
    res.json({ stats: { departments: deptCount, positions: posCount, employees: empCount } });
  } catch (error) { console.error('Error getting stats:', error); res.status(500).json({ error: 'Error al obtener estadisticas' }); }
};