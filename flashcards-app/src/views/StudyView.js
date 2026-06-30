// SRP: UI exclusiva de la vista de estudio
import { getCategoryColor } from "../constants/categories";
import { speakText } from "../services/speech";
import { usePronunciation } from "../hooks/usePronunciation";

export default function StudyView({
  deck,
  currentIdx,
  flipped,
  onFlip,
  onNavigate,
  onBuildDeck,
  progress,
  onMarkProgress,
  onToggleIncidir,
  filter,
  onFilterChange,
  categories,
  shuffled,
  onShuffleToggle,
  incidirMode,
  onToggleIncidirMode,
  known,
  learning,
  totalCards,
}) {
  const current = deck[currentIdx];
  const { pronunciationResult, listening, practice } = usePronunciation(current?.word);

  const handleMark = (status) => {
    if (!current) return;
    onMarkProgress(current.id, status);
    if (currentIdx < deck.length - 1) onNavigate(1);
  };

  return (
    <main className="study-view">
      <div className="stats-bar">
        <span className="stat known">✓ {known} dominadas</span>
        <span className="stat learning">↻ {learning} repasando</span>
        <span className="stat total">📚 {totalCards} total</span>
      </div>

      <div className="controls">
        <select className="filter-select" value={filter} onChange={e => onFilterChange(e.target.value)}>
          {categories.map(c => (
            <option key={c} value={c}>{c === "all" ? "Todas las categorías" : c}</option>
          ))}
        </select>
        <button className={`shuffle-btn ${shuffled ? "on" : ""}`} onClick={onShuffleToggle}>
          {shuffled ? "🔀 Aleatorio ON" : "🔀 Aleatorio"}
        </button>
        <button className={`incidir-mode-btn ${incidirMode ? "on" : ""}`} onClick={onToggleIncidirMode}>
          {incidirMode ? "⚠️ Revisar tarjetas con insistir activo ON" : "⚠️ Revisar tarjetas con insistir activo"}
        </button>
        <button className="reset-btn" onClick={onBuildDeck}>↺ Reiniciar</button>
      </div>

      {deck.length === 0 ? (
        <div className="empty">
          {incidirMode
            ? "No tienes tarjetas marcadas para repasar. Activa el checkbox \"Incidir\" en las tarjetas que quieras reforzar."
            : "No hay tarjetas en esta categoría."}
        </div>
      ) : (
        <>
          <div className="progress-line">
            <div className="progress-fill" style={{ width: `${((currentIdx + 1) / deck.length) * 100}%` }} />
          </div>
          <p className="card-counter">{currentIdx + 1} / {deck.length}</p>

          <div className={`card-wrapper ${flipped ? "flipped" : ""}`} onClick={onFlip}>
            <div className="card">
              <div className="card-front">
                <span className="card-category" style={{ background: getCategoryColor(current.category) }}>
                  {current.category}
                </span>
                {progress[current.id] && (
                  <span className={`card-status ${progress[current.id]}`}>
                    {progress[current.id] === "known" ? "✓" : "↻"}
                  </span>
                )}
                <label className="incidir-checkbox" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={!!current.incidir}
                    onChange={() => onToggleIncidir(current.id)}
                  />
                  Insistir en esta tarjeta
                </label>
                <div className="card-word">{current.word}</div>
                <div className="pronounce-row" onClick={e => e.stopPropagation()}>
                  <button className="sound-btn" onClick={e => speakText(current.word, e)} title="Escuchar pronunciación">
                    🔊 Escuchar
                  </button>
                  <button
                    className={`mic-btn ${listening ? "listening" : ""}`}
                    onClick={practice}
                    title="Practicar pronunciación"
                  >
                    🎤 Practicar
                  </button>
                </div>
                {listening && <p className="listening-hint">🎙️ Escuchando...</p>}
                {pronunciationResult && (
                  <div
                    className={`pronunciation-feedback ${pronunciationResult.type}`}
                    onClick={e => e.stopPropagation()}
                  >
                    {pronunciationResult.type === "unsupported" && "Tu navegador no soporta el reconocimiento de voz."}
                    {pronunciationResult.type === "error" && "No se pudo reconocer el audio. Inténtalo de nuevo."}
                    {pronunciationResult.type === "match" && (
                      <>✅ ¡Correcto! Dijiste: "{pronunciationResult.heard}"</>
                    )}
                    {pronunciationResult.type === "no-match" && (
                      <>❌ Esperado: "{pronunciationResult.expected}" — Entendí: "{pronunciationResult.heard}"</>
                    )}
                  </div>
                )}
                <p className="card-hint">Toca para ver el significado</p>
              </div>

              <div className="card-back">
                <span className="card-category" style={{ background: getCategoryColor(current.category) }}>
                  {current.category}
                </span>
                <div className="card-meaning">{current.meaning}</div>
                <div className="pronounce-row" onClick={e => e.stopPropagation()}>
                  <button className="sound-btn" onClick={e => speakText(current.word, e)} title="Escuchar pronunciación">
                    🔊 {current.word}
                  </button>
                </div>
                {(current.examples || (current.example ? [current.example] : [])).map((ex, i) => (
                  <div key={i} className="card-example-row">
                    <div className="card-example">"{ex}"</div>
                    <button className="sound-btn small" onClick={e => speakText(ex, e)} title="Escuchar ejemplo">
                      🔊
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="action-row">
            <button className="action-btn learning" onClick={() => handleMark("learning")}>↻ Repasar</button>
            <button className="nav-arrow" onClick={() => onNavigate(-1)} disabled={currentIdx === 0}>←</button>
            <button className="nav-arrow" onClick={() => onNavigate(1)} disabled={currentIdx === deck.length - 1}>→</button>
            <button className="action-btn known" onClick={() => handleMark("known")}>✓ Dominada</button>
          </div>
        </>
      )}
    </main>
  );
}
