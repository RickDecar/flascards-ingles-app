// OCP: agregar una categoría nueva solo requiere tocar este archivo, no App.js
export const CATEGORY_COLORS = {
  "Expresiones":    "#E8A87C",
  "Verbos":         "#85C1E9",
  "Sustantivos":    "#82E0AA",
  "Adjetivos":      "#C39BD3",
  "Alta frecuencia":"#F9E79F",
  "Phrasal Verbs":  "#F1948A",
  "Grimm":          "#A9CCE3",
  "Breaking Bad":   "#7DCEA0",
  "Náutico":        "#5DADE2",
  "Sugar":          "#F5B7B1",
  "Prompting / IA": "#BB8FCE",
  "The Undeclared War": "#AEB6BF",
  "The Instigators":    "#F8C471",
  "Historia":       "#D7BDE2",
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
