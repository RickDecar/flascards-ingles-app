/**
 * Devuelve una copia de las tarjetas en orden aleatorio (Fisher-Yates).
 * @param {Array} tarjetas
 * @param {() => number} [aleatorio] función que devuelve un número en [0, 1); inyectable para tests
 * @returns {Array}
 */
export function barajar(tarjetas, aleatorio = Math.random) {
  const copia = [...tarjetas];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Ordena las tarjetas según el orden previo de ids. Las tarjetas cuyo id no
 * estaba en el orden previo (nuevas) se colocan al final, respetando su orden de entrada.
 * @param {Array} tarjetas
 * @param {Array<number>} idsPrevios
 * @returns {Array}
 */
export function conservarOrden(tarjetas, idsPrevios) {
  const posiciones = new Map(idsPrevios.map((id, i) => [id, i]));
  const conocidas = tarjetas.filter(t => posiciones.has(t.id));
  const nuevas = tarjetas.filter(t => !posiciones.has(t.id));
  conocidas.sort((a, b) => posiciones.get(a.id) - posiciones.get(b.id));
  return [...conocidas, ...nuevas];
}
