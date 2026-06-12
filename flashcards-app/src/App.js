import { useState, useEffect, useCallback } from "react";
import { initialCards } from "./data";
import "./App.css";

const STORAGE_KEY = "english_flashcards";
const USER_CARDS_KEY = "english_flashcards_user";
const PROGRESS_KEY = "english_flashcards_progress";

function loadCards() {
  try {
    const saved = localStorage.getItem(USER_CARDS_KEY);
    const userCards = saved ? JSON.parse(saved) : [];
    const baseIds = new Set(initialCards.map(c => c.id));
    const extraUserCards = userCards.filter(c => !baseIds.has(c.id));
    return [...initialCards, ...extraUserCards];
  } catch {
    return initialCards;
  }
}

function saveUserCards(allCards) {
  const baseIds = new Set(initialCards.map(c => c.id));
  const userCards = allCards.filter(c => !baseIds.has(c.id));
  localStorage.setItem(USER_CARDS_KEY, JSON.stringify(userCards));
}

const categoryColors = {
  "Expresiones": "#E8A87C",
  "Verbos": "#85C1E9",
  "Sustantivos": "#82E0AA",
  "Adjetivos": "#C39BD3",
  "Alta frecuencia": "#F9E79F",
  "Phrasal Verbs": "#F1948A",
  "Grimm": "#A9CCE3",
};

function getCategoryColor(cat) {
  return categoryColors[cat] || "#D5D8DC";
}

const SpeechRecognitionAPI =
  typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

function speakText(text, e) {
  if (e) e.stopPropagation();
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

export default function App() {
  const [cards, setCards] = useState(() => loadCards());

  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [view, setView] = useState("study"); // study | add | list
  const [filter, setFilter] = useState("all");
  const [flipped, setFlipped] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [newCard, setNewCard] = useState({ word: "", meaning: "", examples: ["", "", "", "", ""], category: "Alta frecuencia" });
  const [editId, setEditId] = useState(null);
  const [shuffled, setShuffled] = useState(false);
  const [deck, setDeck] = useState([]);
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [listening, setListening] = useState(false);

  const categories = ["all", ...Array.from(new Set(cards.map(c => c.category)))];

  useEffect(() => {
    saveUserCards(cards);
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const buildDeck = useCallback(() => {
    let filtered = filter === "all" ? cards : cards.filter(c => c.category === filter);
    if (shuffled) filtered = [...filtered].sort(() => Math.random() - 0.5);
    setDeck(filtered);
    setCurrentIdx(0);
    setFlipped(false);
  }, [cards, filter, shuffled]);

  useEffect(() => { buildDeck(); }, [buildDeck]);

  const current = deck[currentIdx];

  useEffect(() => {
    setPronunciationResult(null);
    setListening(false);
  }, [current?.id]);

  const practicePronunciation = (e) => {
    e.stopPropagation();
    if (!current) return;
    if (!SpeechRecognitionAPI) {
      setPronunciationResult({ type: "unsupported" });
      return;
    }
    setPronunciationResult(null);
    setListening(true);
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const heard = event.results[0][0].transcript.trim();
      const expected = current.word.trim();
      const match = heard.toLowerCase() === expected.toLowerCase();
      setPronunciationResult({ type: match ? "match" : "no-match", heard, expected });
    };

    recognition.onerror = () => {
      setPronunciationResult({ type: "error" });
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const navigate = (dir) => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIdx(i => Math.max(0, Math.min(deck.length - 1, i + dir)));
    }, 150);
  };

  const markProgress = (status) => {
    if (!current) return;
    setProgress(p => ({ ...p, [current.id]: status }));
    if (currentIdx < deck.length - 1) navigate(1);
  };

  const saveCard = () => {
    if (!newCard.word.trim() || !newCard.meaning.trim()) return;
    const cleanExamples = newCard.examples.filter(e => e.trim());
    const cardToSave = { ...newCard, examples: cleanExamples };
    if (editId !== null) {
      setCards(cs => cs.map(c => c.id === editId ? { ...c, ...cardToSave } : c));
      setEditId(null);
    } else {
      const id = Date.now();
      setCards(cs => [...cs, { id, type: "word", ...cardToSave }]);
    }
    setNewCard({ word: "", meaning: "", examples: ["", "", "", "", ""], category: "Alta frecuencia" });
    setShowForm(false);
  };

  const deleteCard = (id) => {
    setCards(cs => cs.filter(c => c.id !== id));
    setProgress(p => { const np = { ...p }; delete np[id]; return np; });
  };

  const startEdit = (card) => {
    const examples = card.examples || (card.example ? [card.example, "", "", "", ""] : ["", "", "", "", ""]);
    const padded = [...examples, "", "", "", "", ""].slice(0, 5);
    setNewCard({ word: card.word, meaning: card.meaning, examples: padded, category: card.category });
    setEditId(card.id);
    setShowForm(true);
    setView("add");
  };

  const known = Object.values(progress).filter(v => v === "known").length;
  const learning = Object.values(progress).filter(v => v === "learning").length;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🎬</span>
            <span className="logo-text">FlashCine</span>
            <span className="logo-sub">English from movies</span>
          </div>
          <nav className="nav">
            <button className={`nav-btn ${view === "study" ? "active" : ""}`} onClick={() => setView("study")}>Estudiar</button>
            <button className={`nav-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>Vocabulario</button>
            <button className={`nav-btn add-btn`} onClick={() => { setView("add"); setShowForm(true); setEditId(null); setNewCard({ word: "", meaning: "", examples: ["","","","",""], category: "Alta frecuencia" }); }}>+ Añadir</button>
          </nav>
        </div>
      </header>

      {view === "study" && (
        <main className="study-view">
          <div className="stats-bar">
            <span className="stat known">✓ {known} dominadas</span>
            <span className="stat learning">↻ {learning} repasando</span>
            <span className="stat total">📚 {cards.length} total</span>
          </div>

          <div className="controls">
            <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c === "all" ? "Todas las categorías" : c}</option>)}
            </select>
            <button className={`shuffle-btn ${shuffled ? "on" : ""}`} onClick={() => setShuffled(s => !s)}>
              {shuffled ? "🔀 Aleatorio ON" : "🔀 Aleatorio"}
            </button>
            <button className="reset-btn" onClick={buildDeck}>↺ Reiniciar</button>
          </div>

          {deck.length === 0 ? (
            <div className="empty">No hay tarjetas en esta categoría.</div>
          ) : (
            <>
              <div className="progress-line">
                <div className="progress-fill" style={{ width: `${((currentIdx + 1) / deck.length) * 100}%` }} />
              </div>
              <p className="card-counter">{currentIdx + 1} / {deck.length}</p>

              <div className={`card-wrapper ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(f => !f)}>
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
                    <div className="card-word">{current.word}</div>
                    <div className="pronounce-row" onClick={e => e.stopPropagation()}>
                      <button className="sound-btn" onClick={(e) => speakText(current.word, e)} title="Escuchar pronunciación">🔊 Escuchar</button>
                      <button className={`mic-btn ${listening ? "listening" : ""}`} onClick={practicePronunciation} title="Practicar pronunciación">🎤 Practicar</button>
                    </div>
                    {listening && <p className="listening-hint">🎙️ Escuchando...</p>}
                    {pronunciationResult && (
                      <div className={`pronunciation-feedback ${pronunciationResult.type}`} onClick={e => e.stopPropagation()}>
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
                      <button className="sound-btn" onClick={(e) => speakText(current.word, e)} title="Escuchar pronunciación">🔊 {current.word}</button>
                    </div>
                    {(current.examples || (current.example ? [current.example] : [])).map((ex, i) => (
                      <div key={i} className="card-example-row">
                        <div className="card-example">"{ex}"</div>
                        <button className="sound-btn small" onClick={(e) => speakText(ex, e)} title="Escuchar ejemplo">🔊</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="action-row">
                <button className="action-btn learning" onClick={() => markProgress("learning")}>↻ Repasar</button>
                <button className="nav-arrow" onClick={() => navigate(-1)} disabled={currentIdx === 0}>←</button>
                <button className="nav-arrow" onClick={() => navigate(1)} disabled={currentIdx === deck.length - 1}>→</button>
                <button className="action-btn known" onClick={() => markProgress("known")}>✓ Dominada</button>
              </div>
            </>
          )}
        </main>
      )}

      {view === "list" && (
        <main className="list-view">
          <div className="list-header">
            <h2>Tu vocabulario <span className="count-badge">{cards.length}</span></h2>
            <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c === "all" ? "Todas" : c}</option>)}
            </select>
          </div>
          <div className="card-list">
            {(filter === "all" ? cards : cards.filter(c => c.category === filter)).map(card => (
              <div key={card.id} className="list-item">
                <div className="list-item-left">
                  <span className="list-cat" style={{ background: getCategoryColor(card.category) }}>{card.category}</span>
                  <span className="list-word">{card.word}</span>
                  <span className="list-meaning">{card.meaning}</span>
                </div>
                <div className="list-item-right">
                  {progress[card.id] && <span className={`pill ${progress[card.id]}`}>{progress[card.id] === "known" ? "✓" : "↻"}</span>}
                  <button className="icon-btn" onClick={() => startEdit(card)}>✏️</button>
                  <button className="icon-btn del" onClick={() => deleteCard(card.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {view === "add" && (
        <main className="add-view">
          <h2>{editId ? "Editar tarjeta" : "Nueva tarjeta"}</h2>
          <div className="form">
            <label>Palabra / Expresión en inglés</label>
            <input placeholder="ej: Figure out" value={newCard.word} onChange={e => setNewCard(n => ({ ...n, word: e.target.value }))} />

            <label>Significado en español</label>
            <input placeholder="ej: Descifrar / Resolver" value={newCard.meaning} onChange={e => setNewCard(n => ({ ...n, meaning: e.target.value }))} />

            <label>Ejemplos de uso (hasta 5)</label>
            {newCard.examples.map((ex, i) => (
              <input key={i} placeholder={`Ejemplo ${i + 1}${i === 0 ? " (obligatorio)" : " (opcional)"}`} value={ex}
                onChange={e => {
                  const updated = [...newCard.examples];
                  updated[i] = e.target.value;
                  setNewCard(n => ({ ...n, examples: updated }));
                }} />
            ))}

            <label>Categoría</label>
            <select value={newCard.category} onChange={e => setNewCard(n => ({ ...n, category: e.target.value }))}>
              {Array.from(new Set([...cards.map(c => c.category), "Alta frecuencia", "Phrasal Verbs", "Expresiones", "Verbos", "Sustantivos", "Adjetivos"])).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__new__">+ Nueva categoría...</option>
            </select>
            {newCard.category === "__new__" && (
              <input placeholder="Nombre de la nueva categoría" onChange={e => setNewCard(n => ({ ...n, category: e.target.value }))} />
            )}

            <div className="form-actions">
              <button className="cancel-btn" onClick={() => { setView("study"); setShowForm(false); setEditId(null); }}>Cancelar</button>
              <button className="save-btn" onClick={saveCard}>{editId ? "Guardar cambios" : "Añadir tarjeta"}</button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
