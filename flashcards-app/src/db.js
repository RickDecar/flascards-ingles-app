import initSqlJs from "sql.js";
import { initialCards } from "./data";

const IDB_NAME = "flashcards_sqlite";
const IDB_STORE = "db";
const IDB_KEY = "main";
const PERSIST_DEBOUNCE_MS = 800;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'word',
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Sin categoría',
  incidir INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  example_text TEXT NOT NULL,
  position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS progress (
  card_id INTEGER PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  status TEXT CHECK(status IN ('known','learning')) NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);
`;

let db = null;
let saveTimer = null;

function openIdb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadBinary() {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function saveBinary(binary) {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(binary, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function persistNow() {
  return saveBinary(db.export()).catch(err => console.error("No se pudo guardar la base de datos en IndexedDB", err));
}

function schedulePersist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persistNow, PERSIST_DEBOUNCE_MS);
}

function insertExamples(cardId, examples) {
  examples.forEach((ex, i) => {
    if (ex && ex.trim()) {
      db.run("INSERT INTO examples (card_id, example_text, position) VALUES (?, ?, ?)", [cardId, ex, i]);
    }
  });
}

function seed() {
  initialCards.forEach(card => {
    db.run("INSERT INTO cards (id, type, word, meaning, category) VALUES (?, ?, ?, ?, ?)", [
      card.id,
      card.type || "word",
      card.word,
      card.meaning,
      card.category || "Sin categoría",
    ]);
    insertExamples(card.id, card.examples || []);
  });
}

function migrateDB() {
  try {
    db.run("ALTER TABLE cards ADD COLUMN incidir INTEGER NOT NULL DEFAULT 0");
  } catch (_) {
    // column already exists
  }
}

export async function initDB() {
  if (db) return { cards: getAllCards(), progress: getProgress() };

  const SQL = await initSqlJs({ locateFile: file => `/${file}` });
  const saved = await loadBinary();

  if (saved) {
    db = new SQL.Database(new Uint8Array(saved));
    db.run("PRAGMA foreign_keys = ON;");
    migrateDB();
  } else {
    db = new SQL.Database();
    db.run("PRAGMA foreign_keys = ON;");
    db.run(SCHEMA_SQL);
    seed();
    await persistNow();
  }

  return { cards: getAllCards(), progress: getProgress() };
}

export function getAllCards() {
  const cards = [];
  const cardsRes = db.exec("SELECT id, type, word, meaning, category, incidir FROM cards ORDER BY id ASC");
  if (cardsRes.length) {
    cardsRes[0].values.forEach(([id, type, word, meaning, category, incidir]) => {
      cards.push({ id, type, word, meaning, category, incidir: !!incidir, examples: [] });
    });
  }

  const examplesByCard = new Map();
  const examplesRes = db.exec("SELECT card_id, example_text FROM examples ORDER BY card_id ASC, position ASC, id ASC");
  if (examplesRes.length) {
    examplesRes[0].values.forEach(([cardId, text]) => {
      if (!examplesByCard.has(cardId)) examplesByCard.set(cardId, []);
      examplesByCard.get(cardId).push(text);
    });
  }

  cards.forEach(card => {
    card.examples = examplesByCard.get(card.id) || [];
  });

  return cards;
}

export function getProgress() {
  const progress = {};
  const res = db.exec("SELECT card_id, status FROM progress");
  if (res.length) {
    res[0].values.forEach(([cardId, status]) => {
      progress[cardId] = status;
    });
  }
  return progress;
}

export function addCard(card) {
  const id = Date.now();
  const type = card.type || "word";
  const category = card.category || "Sin categoría";
  db.run("INSERT INTO cards (id, type, word, meaning, category) VALUES (?, ?, ?, ?, ?)", [
    id, type, card.word, card.meaning, category,
  ]);
  insertExamples(id, card.examples || []);
  schedulePersist();
  return { id, type, word: card.word, meaning: card.meaning, category, examples: card.examples || [] };
}

export function updateCard(id, card) {
  const type = card.type || "word";
  const category = card.category || "Sin categoría";
  db.run("UPDATE cards SET type = ?, word = ?, meaning = ?, category = ? WHERE id = ?", [
    type, card.word, card.meaning, category, id,
  ]);
  db.run("DELETE FROM examples WHERE card_id = ?", [id]);
  insertExamples(id, card.examples || []);
  schedulePersist();
}

export function deleteCard(id) {
  db.run("DELETE FROM cards WHERE id = ?", [id]);
  schedulePersist();
}

export function setProgress(cardId, status) {
  db.run(
    `INSERT INTO progress (card_id, status, updated_at) VALUES (?, ?, strftime('%s','now'))
     ON CONFLICT(card_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
    [cardId, status]
  );
  schedulePersist();
}

export function getRecentReviewedWords(limit = 12) {
  const stmt = db.prepare(
    `SELECT c.word FROM progress p
     JOIN cards c ON c.id = p.card_id
     ORDER BY p.updated_at DESC, (p.status = 'learning') DESC
     LIMIT ?`
  );
  stmt.bind([limit]);
  const words = [];
  while (stmt.step()) {
    words.push(stmt.getAsObject().word);
  }
  stmt.free();
  return words;
}

function normalize(text) {
  return (text || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

const MAX_EXAMPLES = 8;

export function importCards(items) {
  if (!Array.isArray(items)) {
    throw new Error("El JSON debe ser un array de tarjetas.");
  }

  const existingCards = getAllCards();
  const byNormalizedWord = new Map(existingCards.map(c => [normalize(c.word), c]));

  let added = 0;
  let updated = 0;

  items.forEach((item, index) => {
    if (!item || typeof item.word !== "string" || !item.word.trim()) return;

    const normWord = normalize(item.word);
    const incomingExamples = Array.isArray(item.examples)
      ? item.examples.filter(ex => typeof ex === "string" && ex.trim())
      : [];
    const existing = byNormalizedWord.get(normWord);

    if (existing) {
      let changed = false;
      let mergedExamples = existing.examples;

      const existingNormalized = new Set(existing.examples.map(normalize));
      const newExamples = incomingExamples.filter(ex => !existingNormalized.has(normalize(ex)));
      if (newExamples.length) {
        mergedExamples = [...existing.examples, ...newExamples];
        if (mergedExamples.length > MAX_EXAMPLES) {
          mergedExamples = mergedExamples.slice(mergedExamples.length - MAX_EXAMPLES);
        }
        changed = true;
      }

      let mergedMeaning = existing.meaning;
      if (typeof item.meaning === "string" && item.meaning.trim()) {
        const newMeaning = item.meaning.trim();
        if (!normalize(existing.meaning).includes(normalize(newMeaning))) {
          mergedMeaning = `${existing.meaning} / ${newMeaning}`;
          changed = true;
        }
      }

      if (changed) {
        updateCard(existing.id, { ...existing, meaning: mergedMeaning, examples: mergedExamples });
        existing.meaning = mergedMeaning;
        existing.examples = mergedExamples;
        updated++;
      }
    } else {
      const id = Date.now() + index;
      const newCard = {
        id,
        type: "word",
        word: item.word.trim(),
        meaning: typeof item.meaning === "string" ? item.meaning.trim() : "",
        category: typeof item.category === "string" && item.category.trim() ? item.category.trim() : "Sin categoría",
        examples: incomingExamples,
      };
      db.run("INSERT INTO cards (id, type, word, meaning, category) VALUES (?, ?, ?, ?, ?)", [
        newCard.id, newCard.type, newCard.word, newCard.meaning, newCard.category,
      ]);
      insertExamples(newCard.id, newCard.examples);
      byNormalizedWord.set(normWord, newCard);
      added++;
    }
  });

  schedulePersist();
  return { added, updated, cards: getAllCards() };
}

export function setIncidir(cardId, value) {
  db.run("UPDATE cards SET incidir = ? WHERE id = ?", [value ? 1 : 0, cardId]);
  schedulePersist();
}

export function exportDatabaseBinary() {
  return db.export();
}

export function exportVocabularyJSON() {
  return getAllCards().map(({ word, meaning, category, examples }) => ({ word, meaning, category, examples }));
}
