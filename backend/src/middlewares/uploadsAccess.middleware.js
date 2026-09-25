/**
 * uploadsAccess.middleware.js
 * ─────────────────────────────────────────────────────────────
 * Reemplaza a express.static para el mount /uploads (hallazgo #1,
 * docs/PROJECT_CONTEXT.md §13). Se monta en src/index.js DESPUÉS de
 * AuthMiddleware.verifyToken, así que req.user ya está disponible aquí.
 *
 * IMPORTANTE: usa res.sendFile, no res.download — download fuerza
 * Content-Disposition: attachment, lo que rompería las imágenes/PDFs
 * que hoy se muestran inline (<img>, <iframe>).
 * ─────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const { resolveUploadAccess } = require('../services/uploadsAccess.service');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

async function serveProtectedUpload(req, res) {
  try {
    // req.path es relativo al mount ('/uploads'), ej: "/purchase-quotes/173-abc.pdf"
    const segments = req.path.split('/').filter(Boolean);
    if (segments.length !== 2) {
      return res.status(400).json({ error: 'Ruta de archivo inválida' });
    }

    const [folder, filename] = segments;
    if (folder.includes('..') || filename.includes('..')) {
      return res.status(400).json({ error: 'Ruta de archivo inválida' });
    }

    const absPath = path.join(UPLOAD_DIR, folder, filename);
    // Defensa en profundidad contra path traversal, aunque Express ya
    // normaliza ".." en req.path antes de que este handler lo reciba.
    if (!absPath.startsWith(UPLOAD_DIR + path.sep)) {
      return res.status(400).json({ error: 'Ruta de archivo inválida' });
    }

    // Forma completa tal como se guarda en los campos de BD (fotoUrl,
    // url_archivo, archivoUrl, cv_url, psych_test_url, pdfUrl).
    const fullPath = `/uploads/${folder}/${filename}`;

    const allowed = await resolveUploadAccess(req, folder, fullPath);
    if (!allowed) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este archivo' });
    }

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    res.sendFile(absPath);
  } catch (error) {
    console.error('Error sirviendo archivo protegido:', error);
    res.status(500).json({ error: 'Error al servir el archivo' });
  }
}

module.exports = { serveProtectedUpload };
