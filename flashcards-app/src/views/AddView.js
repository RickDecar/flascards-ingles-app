// SRP: UI exclusiva del formulario de creación/edición de tarjetas
import { useState } from "react";
import { DEFAULT_CATEGORIES } from "../constants/categories";

const EMPTY_FORM = {
  word: "",
  meaning: "",
  examples: ["", "", "", "", ""],
  category: "Alta frecuencia",
};

function toFormState(card) {
  if (!card) return EMPTY_FORM;
  const examples = card.examples || (card.example ? [card.example, "", "", "", ""] : ["", "", "", "", ""]);
  return {
    word: card.word,
    meaning: card.meaning,
    examples: [...examples, "", "", "", "", ""].slice(0, 5),
    category: card.category,
  };
}

export default function AddView({ editCard, existingCategories, onSave, onCancel }) {
  const [formData, setFormData] = useState(() => toFormState(editCard));

  const allCategories = Array.from(new Set([...existingCategories, ...DEFAULT_CATEGORIES]));

  const handleSave = () => {
    if (!formData.word.trim() || !formData.meaning.trim()) return;
    const cleanExamples = formData.examples.filter(e => e.trim());
    onSave({ ...formData, examples: cleanExamples });
  };

  const setField = (field, value) => setFormData(d => ({ ...d, [field]: value }));

  const setExample = (i, value) => {
    const updated = [...formData.examples];
    updated[i] = value;
    setFormData(d => ({ ...d, examples: updated }));
  };

  return (
    <main className="add-view">
      <h2>{editCard ? "Editar tarjeta" : "Nueva tarjeta"}</h2>
      <div className="form">
        <label>Palabra / Expresión en inglés</label>
        <input
          placeholder="ej: Figure out"
          value={formData.word}
          onChange={e => setField("word", e.target.value)}
        />

        <label>Significado en español</label>
        <input
          placeholder="ej: Descifrar / Resolver"
          value={formData.meaning}
          onChange={e => setField("meaning", e.target.value)}
        />

        <label>Ejemplos de uso (hasta 5)</label>
        {formData.examples.map((ex, i) => (
          <input
            key={i}
            placeholder={`Ejemplo ${i + 1}${i === 0 ? " (obligatorio)" : " (opcional)"}`}
            value={ex}
            onChange={e => setExample(i, e.target.value)}
          />
        ))}

        <label>Categoría</label>
        <select value={formData.category} onChange={e => setField("category", e.target.value)}>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="__new__">+ Nueva categoría...</option>
        </select>
        {formData.category === "__new__" && (
          <input
            placeholder="Nombre de la nueva categoría"
            onChange={e => setField("category", e.target.value)}
          />
        )}

        <div className="form-actions">
          <button className="cancel-btn" onClick={onCancel}>Cancelar</button>
          <button className="save-btn" onClick={handleSave}>
            {editCard ? "Guardar cambios" : "Añadir tarjeta"}
          </button>
        </div>
      </div>
    </main>
  );
}
