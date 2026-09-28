/**
 * Alias de puestos reales del catálogo de producción (plantilla_empleados_UNIFICADA.csv)
 * que no coinciden letra por letra con los 6 nombres canónicos — ver
 * PROJECT_CONTEXT.md / decisión con RH del 2026-09-28.
 */
const { getTemplateByPuestoNombre, PUESTOS } = require('../../../src/config/operationalEvaluationCriteria.config');

describe('🧪 operationalEvaluationCriteria.config — alias de puestos reales', () => {
  test('los 6 nombres canónicos siguen resolviendo (case-insensitive)', () => {
    expect(getTemplateByPuestoNombre('PROMOTOR')).toBe(PUESTOS['Promotor']);
    expect(getTemplateByPuestoNombre('almacenista')).toBe(PUESTOS['Almacenista']);
    expect(getTemplateByPuestoNombre('Chofer')).toBe(PUESTOS['Chofer']);
  });

  test.each([
    ['CHOFER REPARTO', 'Chofer'],
    ['AYUDANTE DE CHOFER', 'Chofer'],
    ['AUXILIAR DE REPARTO', 'Chofer'],
    ['AUXILIAR DE DEVOLUCIONES', 'Almacenista'],
    ['ENCARGADA DE ALMACEN', 'Almacenista'],
    ['DEGUSTADORA', 'Degustador'],
    ['AYUDANTE DE ALMACEN', 'Ayudante General'],
    ['AUXILIAR DE ALMACEN', 'Ayudante General'],
    ['AYUDANTE DE ALMACEN CUN', 'Ayudante General'],
    ['KAM SUR (KEY ACCOUNT MANAGER SUR)', 'Preventista'],
    ['KAM (KEY ACCOUNT MANAGER)', 'Preventista'],
  ])('%s resuelve a la plantilla de %s', (puestoReal, canonico) => {
    expect(getTemplateByPuestoNombre(puestoReal)).toBe(PUESTOS[canonico]);
  });

  test('es case-insensitive también para los alias', () => {
    expect(getTemplateByPuestoNombre('degustadora')).toBe(PUESTOS['Degustador']);
    expect(getTemplateByPuestoNombre('  chofer reparto  ')).toBe(PUESTOS['Chofer']);
  });

  test('un puesto no relacionado no matchea nada (sin falsos positivos)', () => {
    expect(getTemplateByPuestoNombre('ANALISTA DE VENTAS')).toBeNull();
    expect(getTemplateByPuestoNombre('JEFE DE ALMACEN')).toBeNull();
    expect(getTemplateByPuestoNombre('AUXILIAR DE INTENDENCIA')).toBeNull();
  });

  test('nombre vacío o nulo no rompe', () => {
    expect(getTemplateByPuestoNombre('')).toBeNull();
    expect(getTemplateByPuestoNombre(null)).toBeNull();
    expect(getTemplateByPuestoNombre(undefined)).toBeNull();
  });
});
