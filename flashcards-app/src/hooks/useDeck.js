// SRP: construcción del mazo + navegación entre tarjetas
import { useState, useEffect, useCallback, useRef } from "react";

export function useDeck(cards, filter, shuffled, incidirMode = false) {
  const [deck, setDeck] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Rastrea los últimos parámetros estructurales para distinguir cambios de filtro/modo
  // (que sí deben resetear la posición) de cambios de datos de tarjetas (que no deben).
  const prevStructureRef = useRef({ filter, shuffled, incidirMode });

  const buildDeck = useCallback((forceReset = false) => {
    let filtered = filter === "all" ? cards : cards.filter(c => c.category === filter);
    if (incidirMode) filtered = filtered.filter(c => c.incidir);
    if (shuffled) filtered = [...filtered].sort(() => Math.random() - 0.5);

    const prev = prevStructureRef.current;
    const estructuraCambio =
      forceReset ||
      prev.filter !== filter ||
      prev.shuffled !== shuffled ||
      prev.incidirMode !== incidirMode;

    prevStructureRef.current = { filter, shuffled, incidirMode };

    setDeck(filtered);
    setFlipped(false);
    if (estructuraCambio) {
      setCurrentIdx(0);
    } else {
      // Solo actualización de datos (ej: toggleIncidir) → preservar posición actual
      setCurrentIdx(i => Math.min(i, Math.max(0, filtered.length - 1)));
    }
  }, [cards, filter, shuffled, incidirMode]);

  useEffect(() => { buildDeck(); }, [buildDeck]);

  const navigate = useCallback((dir) => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIdx(i => Math.max(0, Math.min(deck.length - 1, i + dir)));
    }, 150);
  }, [deck.length]);

  const flip = useCallback(() => setFlipped(f => !f), []);

  // El botón "Reiniciar" siempre vuelve al inicio
  const resetDeck = useCallback(() => buildDeck(true), [buildDeck]);

  return { deck, currentIdx, flipped, flip, navigate, buildDeck: resetDeck };
}
