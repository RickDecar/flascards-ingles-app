export const VALOR_NUEVA_CATEGORIA = "__new__";

/**
 * Determina la categoría final de una tarjeta a partir del estado del formulario.
 * @param {string} categoriaSeleccionada valor del selector (puede ser VALOR_NUEVA_CATEGORIA)
 * @param {string} nombreNueva texto escrito en el campo de nueva categoría
 * @returns {string|null} categoría lista para guardar, o null si se eligió crear una y el nombre está vacío
 */
export function resolverCategoria(categoriaSeleccionada, nombreNueva) {
  if (categoriaSeleccionada !== VALOR_NUEVA_CATEGORIA) return categoriaSeleccionada;
  const nombre = (nombreNueva || "").trim();
  return nombre || null;
}
