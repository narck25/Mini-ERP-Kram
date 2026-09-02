/**
 * Ordena una lista de items para que cada "jefe" quede antes que quienes
 * dependen de él (algoritmo de Kahn). Usado por employee-csv.controller.js
 * para que la importación de empleados no dependa de que el CSV venga
 * ordenado manualmente (jefes antes que subordinados).
 *
 * Internamente usa el ÍNDICE de cada item (no `getKey(item)`) como
 * identidad canónica del grafo — `getKey` puede devolver vacío o valores
 * duplicados (ej. la columna CLAVE es opcional en el CSV) sin que eso
 * provoque que un item se pierda del resultado.
 *
 * Reglas:
 *  - Si un item no tiene dependencia (getDependencyKey devuelve vacío), su
 *    "jefe" no aparece en la lista, o su clave está duplicada y no es la
 *    primera ocurrencia, no se agrega ninguna arista — queda como nodo raíz.
 *  - Una auto-referencia (getDependencyKey(item) === getKey(item)) se ignora.
 *  - Si hay un ciclo real entre varios items, esos items no alcanzan
 *    in-degree 0 durante el recorrido principal; se anexan al final en su
 *    orden relativo original en vez de colgar el proceso o lanzar un error.
 *  - Sin ninguna dependencia en la lista, el resultado es idéntico al orden
 *    de entrada (caso más común). El arreglo de salida SIEMPRE tiene la
 *    misma longitud que la entrada — ningún item se pierde ni se duplica.
 *
 * @param {Array<T>} items
 * @param {(item: T) => string} getKey - identificador (ej. CLAVE) del item; puede repetirse o venir vacío
 * @param {(item: T) => string|null|undefined} getDependencyKey - clave del "jefe" del que depende
 * @returns {Array<T>} nueva lista reordenada (no muta `items`)
 */
function topologicalSort(items, getKey, getDependencyKey) {
  const n = items.length;

  // Solo la PRIMERA ocurrencia de cada clave no vacía es un objetivo válido de dependencia.
  const indexByKey = new Map();
  items.forEach((item, idx) => {
    const key = getKey(item);
    if (key && !indexByKey.has(key)) indexByKey.set(key, idx);
  });

  const children = new Map(); // índiceJefe -> [índiceSubordinado, ...]
  const indegree = new Array(n).fill(0);

  items.forEach((item, idx) => {
    const key = getKey(item);
    const depKey = getDependencyKey(item);
    if (!depKey || depKey === key || !indexByKey.has(depKey)) return; // sin arista
    const depIdx = indexByKey.get(depKey);
    if (depIdx === idx) return; // seguridad extra contra auto-referencia indirecta
    if (!children.has(depIdx)) children.set(depIdx, []);
    children.get(depIdx).push(idx);
    indegree[idx] += 1;
  });

  let queue = [];
  for (let i = 0; i < n; i++) if (indegree[i] === 0) queue.push(i);

  const resultIdx = [];
  const visited = new Array(n).fill(false);

  while (queue.length > 0) {
    const idx = queue.shift();
    if (visited[idx]) continue;
    visited[idx] = true;
    resultIdx.push(idx);

    const kids = (children.get(idx) || []).slice().sort((a, b) => a - b);
    for (const kidIdx of kids) {
      indegree[kidIdx] -= 1;
      if (indegree[kidIdx] === 0) queue.push(kidIdx);
    }
    queue.sort((a, b) => a - b);
  }

  // Cualquier índice que no se haya resuelto (ciclo) se anexa al final en su orden original.
  const restantes = [];
  for (let i = 0; i < n; i++) if (!visited[i]) restantes.push(i);

  return [...resultIdx, ...restantes].map((idx) => items[idx]);
}

module.exports = { topologicalSort };
