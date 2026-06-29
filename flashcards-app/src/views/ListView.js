// SRP: UI exclusiva de la vista de vocabulario (lista, importar, exportar)
import { useRef, useState } from "react";
import { getCategoryColor } from "../constants/categories";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ListView({
  cards,
  progress,
  filter,
  onFilterChange,
  categories,
  onEdit,
  onDelete,
  onImport,
  onExportDatabase,
  onExportVocabulary,
}) {
  const importInputRef = useRef(null);
  const [importMessage, setImportMessage] = useState(null);

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const { added, updated } = onImport(data);
        setImportMessage({
          type: "success",
          text: `${added} palabras nuevas añadidas, ${updated} palabras actualizadas con nuevos ejemplos.`,
        });
      } catch {
        setImportMessage({
          type: "error",
          text: "No se pudo importar el archivo. Comprueba que sea un JSON válido con el formato esperado.",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportDatabase = () => {
    const binary = onExportDatabase();
    downloadBlob(new Blob([binary], { type: "application/x-sqlite3" }), "flashcards.sqlite");
  };

  const handleExportVocabularyJson = () => {
    const data = onExportVocabulary();
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      "vocabulario.json"
    );
  };

  const filteredCards = filter === "all" ? cards : cards.filter(c => c.category === filter);

  return (
    <main className="list-view">
      <div className="list-header">
        <h2>Tu vocabulario <span className="count-badge">{cards.length}</span></h2>
        <select className="filter-select" value={filter} onChange={e => onFilterChange(e.target.value)}>
          {categories.map(c => (
            <option key={c} value={c}>{c === "all" ? "Todas" : c}</option>
          ))}
        </select>
      </div>

      <div className="list-toolbar">
        <input
          type="file"
          accept=".json,application/json"
          ref={importInputRef}
          onChange={handleImportJson}
          style={{ display: "none" }}
        />
        <button className="toolbar-btn" onClick={() => importInputRef.current?.click()}>📥 Importar JSON</button>
        <button className="toolbar-btn" onClick={handleExportDatabase}>🗄️ Exportar base de datos</button>
        <button className="toolbar-btn" onClick={handleExportVocabularyJson}>📤 Exportar vocabulario a JSON</button>
      </div>

      {importMessage && (
        <div className={`import-message ${importMessage.type}`}>
          {importMessage.text}
          <button className="close-msg-btn" onClick={() => setImportMessage(null)}>✕</button>
        </div>
      )}

      <div className="card-list">
        {filteredCards.map(card => (
          <div key={card.id} className="list-item">
            <div className="list-item-left">
              <span className="list-cat" style={{ background: getCategoryColor(card.category) }}>
                {card.category}
              </span>
              <span className="list-word">{card.word}</span>
              <span className="list-meaning">{card.meaning}</span>
            </div>
            <div className="list-item-right">
              {progress[card.id] && (
                <span className={`pill ${progress[card.id]}`}>
                  {progress[card.id] === "known" ? "✓" : "↻"}
                </span>
              )}
              <button className="icon-btn" onClick={() => onEdit(card)}>✏️</button>
              <button className="icon-btn del" onClick={() => onDelete(card.id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
