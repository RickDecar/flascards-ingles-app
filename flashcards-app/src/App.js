// SRP/OCP: App.js es un orquestador puro — solo gestiona el routing de vistas
// y delega toda la lógica a hooks y componentes especializados
import { useState, useEffect } from "react";
import "./App.css";
import { useCards } from "./hooks/useCards";
import { useDeck } from "./hooks/useDeck";
import StudyView from "./views/StudyView";
import ListView from "./views/ListView";
import AddView from "./views/AddView";
import ChatView from "./ChatView";

export default function App() {
  // DIP: App depende de abstracciones (hooks), no de implementaciones concretas (db.js)
  const {
    cards,
    progress,
    dbReady,
    addCard,
    updateCard,
    deleteCard,
    markProgress,
    toggleIncidir,
    importCards,
    exportDatabase,
    exportVocabulary,
    getRecentWords,
  } = useCards();

  const [view, setView] = useState("study");
  const [filter, setFilter] = useState("all");
  const [shuffled, setShuffled] = useState(false);
  const [incidirMode, setIncidirMode] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [recentWords, setRecentWords] = useState([]);

  const { deck, currentIdx, flipped, flip, navigate, buildDeck } = useDeck(cards, filter, shuffled, incidirMode);

  const categories = ["all", ...Array.from(new Set(cards.map(c => c.category)))];

  useEffect(() => {
    if (dbReady && view === "chat") {
      setRecentWords(getRecentWords());
    }
  }, [dbReady, view, getRecentWords]);

  // Handlers de coordinación entre hooks y vistas
  const handleSaveCard = (cardData) => {
    if (editCard) {
      updateCard(editCard.id, cardData);
    } else {
      addCard(cardData);
    }
    setEditCard(null);
    setView("study");
  };

  const handleStartEdit = (card) => {
    setEditCard(card);
    setView("add");
  };

  const handleAddNew = () => {
    setEditCard(null);
    setView("add");
  };

  const known = Object.values(progress).filter(v => v === "known").length;
  const learning = Object.values(progress).filter(v => v === "learning").length;

  if (!dbReady) {
    return (
      <div className="app">
        <div className="loading-screen">
          <span className="logo-icon">🎬</span>
          <p>Cargando base de datos...</p>
        </div>
      </div>
    );
  }

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
            <button className={`nav-btn ${view === "study" ? "active" : ""}`} onClick={() => setView("study")}>
              Estudiar
            </button>
            <button className={`nav-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
              Vocabulario
            </button>
            <button className={`nav-btn ${view === "chat" ? "active" : ""}`} onClick={() => setView("chat")}>
              Conversar
            </button>
            <button className="nav-btn add-btn" onClick={handleAddNew}>+ Añadir</button>
          </nav>
        </div>
      </header>

      {view === "study" && (
        <StudyView
          deck={deck}
          currentIdx={currentIdx}
          flipped={flipped}
          onFlip={flip}
          onNavigate={navigate}
          onBuildDeck={buildDeck}
          progress={progress}
          onMarkProgress={markProgress}
          onToggleIncidir={toggleIncidir}
          filter={filter}
          onFilterChange={setFilter}
          categories={categories}
          shuffled={shuffled}
          onShuffleToggle={() => setShuffled(s => !s)}
          incidirMode={incidirMode}
          onToggleIncidirMode={() => setIncidirMode(m => !m)}
          known={known}
          learning={learning}
          totalCards={cards.length}
        />
      )}

      {view === "list" && (
        <ListView
          cards={cards}
          progress={progress}
          filter={filter}
          onFilterChange={setFilter}
          categories={categories}
          onEdit={handleStartEdit}
          onDelete={deleteCard}
          onImport={importCards}
          onExportDatabase={exportDatabase}
          onExportVocabulary={exportVocabulary}
        />
      )}

      {view === "add" && (
        <AddView
          editCard={editCard}
          existingCategories={categories.filter(c => c !== "all")}
          onSave={handleSaveCard}
          onCancel={() => { setEditCard(null); setView("study"); }}
        />
      )}

      {view === "chat" && <ChatView recentWords={recentWords} />}
    </div>
  );
}
