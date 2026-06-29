// OCP: agregar una categoría nueva solo requiere tocar este archivo, no App.js
export const CATEGORY_COLORS = {
  "Expresiones":    "#E8A87C",
  "Verbos":         "#85C1E9",
  "Sustantivos":    "#82E0AA",
  "Adjetivos":      "#C39BD3",
  "Alta frecuencia":"#F9E79F",
  "Phrasal Verbs":  "#F1948A",
  "Grimm":          "#A9CCE3",
};

export const DEFAULT_CATEGORIES = [
  "Alta frecuencia",
  "Phrasal Verbs",
  "Expresiones",
  "Verbos",
  "Sustantivos",
  "Adjetivos",
];

export function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || "#D5D8DC";
}
