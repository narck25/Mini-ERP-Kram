const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Subir foto de perfil de empleado
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Construir URL relativa de la foto
    const photoUrl = '/uploads/photos/' + req.file.filename;

    // Actualizar empleado con la URL de la foto
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        fotoUrl: photoUrl
      },
      select: {
        id: true,
        nombre: true,
        fotoUrl: true
      }
    });

    res.json({
      message: 'Foto de perfil actualizada exitosamente',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ error: 'Error al subir la foto de perfil' });
  }
};
