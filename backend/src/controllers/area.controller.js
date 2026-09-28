const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllAreas = async (req, res) => {
  try {
    const areas = await prisma.area.findMany({ orderBy: { nombre: 'asc' } });
    res.json({ areas });
  } catch (error) {
    console.error('Error getting areas:', error);
    res.status(500).json({ error: 'Error al obtener áreas' });
  }
};

exports.createArea = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
    const area = await prisma.area.create({ data: { nombre: nombre.trim() } });
    res.status(201).json({ area, message: 'Área creada' });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Ya existe un área con ese nombre' });
    console.error('Error creating area:', error);
    res.status(500).json({ error: 'Error al crear área' });
  }
};

exports.updateArea = async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    const data = {};
    if (nombre !== undefined) data.nombre = nombre.trim();
    if (estado !== undefined) data.estado = estado;
    const area = await prisma.area.update({ where: { id: req.params.id }, data });
    res.json({ area, message: 'Área actualizada' });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Ya existe un área con ese nombre' });
    console.error('Error updating area:', error);
    res.status(500).json({ error: 'Error al actualizar área' });
  }
};

exports.deleteArea = async (req, res) => {
  try {
    const enUso = await prisma.employee.count({ where: { areaId: req.params.id } });
    if (enUso > 0) {
      return res.status(400).json({ error: `No se puede eliminar: ${enUso} empleado(s) tienen esta área asignada. Desactívala en su lugar.` });
    }
    await prisma.area.delete({ where: { id: req.params.id } });
    res.json({ message: 'Área eliminada' });
  } catch (error) {
    console.error('Error deleting area:', error);
    res.status(500).json({ error: 'Error al eliminar área' });
  }
};
