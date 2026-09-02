const { topologicalSort } = require('../../../src/utils/topoSort');

const byId = (id) => (item) => item.id === id;
const getKey = (item) => item.id;
const getDep = (item) => item.jefe;

describe('topologicalSort', () => {
  test('sin dependencias: el orden queda idéntico al de entrada', () => {
    const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const result = topologicalSort(items, getKey, getDep);
    expect(result.map(getKey)).toEqual(['1', '2', '3']);
  });

  test('subordinado antes que su jefe en el archivo: el jefe queda primero', () => {
    const items = [
      { id: 'sub', jefe: 'jefe' },
      { id: 'jefe' }
    ];
    const result = topologicalSort(items, getKey, getDep);
    expect(result.map(getKey)).toEqual(['jefe', 'sub']);
  });

  test('varios subordinados del mismo jefe conservan su orden relativo entre sí', () => {
    const items = [
      { id: 'sub1', jefe: 'jefe' },
      { id: 'sub2', jefe: 'jefe' },
      { id: 'jefe' }
    ];
    const result = topologicalSort(items, getKey, getDep);
    expect(result.map(getKey)).toEqual(['jefe', 'sub1', 'sub2']);
  });

  test('jefe ausente de la lista: el item no se reordena', () => {
    const items = [
      { id: 'a', jefe: 'no-existe' },
      { id: 'b' }
    ];
    const result = topologicalSort(items, getKey, getDep);
    expect(result.map(getKey)).toEqual(['a', 'b']);
  });

  test('auto-referencia: no se reordena ni causa error', () => {
    const items = [{ id: 'a', jefe: 'a' }, { id: 'b' }];
    const result = topologicalSort(items, getKey, getDep);
    expect(result.map(getKey)).toEqual(['a', 'b']);
  });

  test('ciclo de 2 nodos: no cuelga, ambos se anexan en su orden original', () => {
    const items = [
      { id: 'a', jefe: 'b' },
      { id: 'b', jefe: 'a' },
      { id: 'c' }
    ];
    const result = topologicalSort(items, getKey, getDep);
    expect(result).toHaveLength(3);
    expect(result.map(getKey)).toContain('a');
    expect(result.map(getKey)).toContain('b');
    expect(result.map(getKey)).toContain('c');
    // 'c' no depende de nada, debe resolverse antes que el ciclo
    expect(result.map(getKey).indexOf('c')).toBeLessThan(result.map(getKey).indexOf('a'));
  });

  test('caso real: encadenado de 3 niveles fuera de orden', () => {
    const items = [
      { id: 'nieto', jefe: 'hijo' },
      { id: 'hijo', jefe: 'abuelo' },
      { id: 'abuelo' }
    ];
    const result = topologicalSort(items, getKey, getDep);
    expect(result.map(getKey)).toEqual(['abuelo', 'hijo', 'nieto']);
  });

  test('no muta el arreglo original', () => {
    const items = [{ id: 'sub', jefe: 'jefe' }, { id: 'jefe' }];
    const copia = [...items];
    topologicalSort(items, getKey, getDep);
    expect(items).toEqual(copia);
  });

  test('claves vacías o duplicadas (CLAVE es opcional en el CSV): ningún item se pierde', () => {
    const items = [
      { id: 'a', clave: '' },
      { id: 'b', clave: '', jefe: 'jefe' },
      { id: 'c', clave: 'jefe' },
      { id: 'd', clave: 'jefe' } // clave duplicada, no debe "robarse" la referencia del jefe real
    ];
    const result = topologicalSort(items, (item) => item.clave, (item) => item.jefe);
    // Ningún item debe perderse ni duplicarse, sin importar el orden exacto.
    expect(result).toHaveLength(4);
    expect(new Set(result.map((r) => r.id))).toEqual(new Set(['a', 'b', 'c', 'd']));
    // 'c' (primera ocurrencia de clave 'jefe') debe quedar antes que 'b', que depende de 'jefe'.
    expect(result.map((r) => r.id).indexOf('c')).toBeLessThan(result.map((r) => r.id).indexOf('b'));
  });
});
