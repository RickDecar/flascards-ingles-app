// SRP: estado de tarjetas + operaciones CRUD, desacoplado de la UI
import { useState, useEffect, useCallback } from "react";
import {
  initDB,
  addCard as dbAddCard,
  updateCard as dbUpdateCard,
  deleteCard as dbDeleteCard,
  setProgress as dbSetProgress,
  importCards as dbImportCards,
  exportDatabaseBinary,
  exportVocabularyJSON,
  getRecentReviewedWords,
} from "../db";

export function useCards() {
  const [cards, setCards] = useState([]);
  const [progress, setProgress] = useState({});
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDB().then(({ cards: dbCards, progress: dbProgress }) => {
      setCards(dbCards);
      setProgress(dbProgress);
      setDbReady(true);
    });
  }, []);

  const addCard = useCallback((cardData) => {
    const saved = dbAddCard(cardData);
    setCards(cs => [...cs, saved]);
    return saved;
  }, []);

  const updateCard = useCallback((id, cardData) => {
    dbUpdateCard(id, cardData);
    setCards(cs => cs.map(c => c.id === id ? { ...c, ...cardData } : c));
  }, []);

  const deleteCard = useCallback((id) => {
    dbDeleteCard(id);
    setCards(cs => cs.filter(c => c.id !== id));
    setProgress(p => { const np = { ...p }; delete np[id]; return np; });
  }, []);

  const markProgress = useCallback((cardId, status) => {
    dbSetProgress(cardId, status);
    setProgress(p => ({ ...p, [cardId]: status }));
  }, []);

  const importCards = useCallback((data) => {
    const result = dbImportCards(data);
    setCards(result.cards);
    return result;
  }, []);

  const getRecentWords = useCallback((limit = 12) => {
    return getRecentReviewedWords(limit);
  }, []);

  return {
    cards,
    progress,
    dbReady,
    addCard,
    updateCard,
    deleteCard,
    markProgress,
    importCards,
    exportDatabase: exportDatabaseBinary,
    exportVocabulary: exportVocabularyJSON,
    getRecentWords,
  };
}
