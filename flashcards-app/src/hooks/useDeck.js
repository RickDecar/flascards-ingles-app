// SRP: construcción del mazo + navegación entre tarjetas
import { useState, useEffect, useCallback } from "react";

export function useDeck(cards, filter, shuffled, incidirMode = false) {
  const [deck, setDeck] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const buildDeck = useCallback(() => {
    let filtered = filter === "all" ? cards : cards.filter(c => c.category === filter);
    if (incidirMode) filtered = filtered.filter(c => c.incidir);
    if (shuffled) filtered = [...filtered].sort(() => Math.random() - 0.5);
    setDeck(filtered);
    setCurrentIdx(0);
    setFlipped(false);
  }, [cards, filter, shuffled, incidirMode]);

  useEffect(() => { buildDeck(); }, [buildDeck]);

  const navigate = useCallback((dir) => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIdx(i => Math.max(0, Math.min(deck.length - 1, i + dir)));
    }, 150);
  }, [deck.length]);

  const flip = useCallback(() => setFlipped(f => !f), []);

  return { deck, currentIdx, flipped, flip, navigate, buildDeck };
}
