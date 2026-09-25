/**
 * Unit Tests: validateFileContent (upload.middleware.js)
 *
 * Hallazgo #9 (docs/PROJECT_CONTEXT.md §13): los uploads solo se
 * validaban por extensión declarada por el cliente, no por el contenido
 * real del archivo. Estas pruebas cubren la verificación de firma
 * (magic bytes) agregada como capa adicional al fileFilter de multer.
 */
const { validateFileContent } = require('../../../src/middlewares/upload.middleware');

function makeReqWithFile(originalname, buffer) {
  return { file: { originalname, buffer, path: undefined } };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

const REAL_PDF = Buffer.from('%PDF-1.4\n%âãÏÓ\n...', 'binary');
const REAL_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0]);
const REAL_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const REAL_DOCX = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]); // zip local file header
const REAL_XLS_LEGACY = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const PLAIN_TEXT_CSV = Buffer.from('nombre,correo,fecha\nJuan,juan@kram.mx,2026-01-01\n', 'utf8');
const FAKE_EXE_HEADER = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]); // "MZ" — ejecutable Windows

describe('🔒 upload.middleware - validateFileContent (Hallazgo #9)', () => {
  test('acepta un PDF cuyo contenido real coincide con la extensión', () => {
    const req = makeReqWithFile('curriculum.pdf', REAL_PDF);
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('rechaza un ejecutable renombrado como .pdf', () => {
    const req = makeReqWithFile('curriculum.pdf', FAKE_EXE_HEADER);
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('acepta un PNG real', () => {
    const req = makeReqWithFile('foto.png', REAL_PNG);
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('rechaza un archivo de texto plano disfrazado de .png', () => {
    const req = makeReqWithFile('foto.png', PLAIN_TEXT_CSV);
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('acepta un JPEG real con extensión .jpg y .jpeg', () => {
    const next1 = jest.fn();
    validateFileContent(makeReqWithFile('foto.jpg', REAL_JPEG), makeRes(), next1);
    expect(next1).toHaveBeenCalled();

    const next2 = jest.fn();
    validateFileContent(makeReqWithFile('foto.jpeg', REAL_JPEG), makeRes(), next2);
    expect(next2).toHaveBeenCalled();
  });

  test('acepta un .docx real (contenedor ZIP de Office Open XML)', () => {
    const req = makeReqWithFile('reporte.docx', REAL_DOCX);
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('rechaza un .docx cuyo contenido no es un ZIP válido', () => {
    const req = makeReqWithFile('reporte.docx', PLAIN_TEXT_CSV);
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('acepta un .xls legado real (OLE2 Compound File)', () => {
    const req = makeReqWithFile('nomina.xls', REAL_XLS_LEGACY);
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('acepta un .csv de texto plano', () => {
    const req = makeReqWithFile('empleados.csv', PLAIN_TEXT_CSV);
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('rechaza un .csv cuyo contenido real es un PDF binario', () => {
    const req = makeReqWithFile('empleados.csv', REAL_PDF);
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('valida cada archivo dentro de req.files (formato .fields(), ej. candidatos con cv + psychTest)', () => {
    const req = {
      files: {
        cv: [{ originalname: 'cv.pdf', buffer: REAL_PDF }],
        psychTest: [{ originalname: 'test.pdf', buffer: FAKE_EXE_HEADER }]
      }
    };
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('test.pdf') })
    );
  });

  test('deja pasar si no hay ningún archivo en la request', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    validateFileContent(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
