# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FlashCine** is a React 18 SPA for learning English vocabulary through interactive flashcards. It ships with 122 pre-installed cards (movies/series vocabulary, phrasal verbs, high-frequency words). All data persists client-side in a SQLite database (sql.js) stored in IndexedDB.

**Tech Stack**: React 18, CSS3 (CSS variables + dark theme), JavaScript ES6+, Create React App (react-scripts 5).

## Development Commands

All commands run from `flashcards-app/`:

```bash
npm install       # install dependencies
npm start         # dev server at http://localhost:3000
npm run build     # production build
```

No test suite is configured (`package.json` has no `test` script).

## Architecture

### Single Component Design

Most of the app lives in `flashcards-app/src/App.js` as one large React component. All state, handlers, and JSX for the Study/List/Add views are co-located there. `App.css` holds all styling. `data.js` exports the `initialCards` array (100 pre-installed vocabulary objects). The Conversar (chat) view is split out into `src/ChatView.js` since it has its own self-contained state and networking — see "Conversation (Ollama)" below.

**Key state in App.js:**

| State | Type | Purpose |
|-------|------|---------|
| `cards` | array | All cards (initialCards + user-created) |
| `progress` | object | `{ cardId: "known" \| "learning" }` |
| `view` | string | `"study"` \| `"add"` \| `"list"` \| `"chat"` |
| `filter` | string | Active category filter |
| `deck` | array | Filtered/shuffled cards for current session |
| `currentIdx` | number | Index into deck |
| `flipped` | boolean | Card face state |
| `recentWords` | array | Words/phrasal verbs with the most recent `progress.updated_at`, fetched when `view` becomes `"chat"` |

### Four Views

1. **Study** — one card at a time, flip animation, mark known/learning, navigate deck
2. **List** — grid of all cards with edit/delete and progress pills
3. **Add** — form to create or edit cards (supports on-the-fly new categories)
4. **Conversar** (`ChatView.js`) — free-form English chat against a local Ollama model, with an async grammar/feedback panel

### Data Persistence (SQLite via sql.js)

`src/db.js` wraps a sql.js (SQLite-WASM) database with three tables: `cards`, `examples`, `progress` (see schema in `db.js`). On first run it seeds the DB from `initialCards` (`src/data.js`). Every mutation (`addCard`, `updateCard`, `deleteCard`, `setProgress`, `importCards`) writes through to the in-memory DB and schedules a debounced export of the binary into IndexedDB (`flashcards_sqlite` / store `db`) so it survives reloads.

`App.js` loads `cards` and `progress` into state via `initDB()` on mount (shows a loading screen until ready), then keeps state in sync by calling the corresponding `db.js` function alongside each `setCards`/`setProgress` update. The sql.js `.wasm` binary is served from `public/sql-wasm.wasm`.

### Import / Export

- **Import JSON** (List view): merges an array of `{ word, meaning, category?, examples? }` objects into the DB via `importCards()` — matches existing cards case-insensitively by `word`, merges/dedupes examples (max 8, newest take priority), and appends distinct meanings with " / ".
- **Export database**: downloads the raw sql.js binary as `flashcards.sqlite` via `exportDatabaseBinary()`.
- **Export vocabulary to JSON**: downloads `exportVocabularyJSON()`, in the same shape accepted by Import JSON.

### Conversation (Ollama)

`src/ollama.js` talks to a local Ollama server at `http://localhost:11434/api/chat` (`stream: false`). Two independent calls per user turn, both built with `callOllama(model, messages)`:

- `sendChatMessage(model, history, recentWords)` — main conversation; system prompt (`buildConversationSystemPrompt`) asks for short (1-3 sentence) replies and naturally weaves in `recentWords` when it fits.
- `getFeedback(model, userMessage)` — separate call with `FEEDBACK_SYSTEM_PROMPT`, analyzing only the latest user message; returns "✓ Correct and natural." or a brief correction.

Both calls throw the same `CONNECTION_ERROR_MESSAGE` if `fetch` fails or the response isn't ok (Ollama not running / model missing) — `ChatView.js` surfaces that as a `.chat-error` banner.

`getRecentReviewedWords(limit)` in `db.js` reads `progress` joined with `cards`, ordered by `updated_at DESC` (ties broken by `status = 'learning'`), giving the words most recently marked known/learning — this is the "reviewed_at" data described in the feature spec (the existing `progress.updated_at` column already serves that purpose, no schema change needed). `App.js` refetches this list whenever `view` becomes `"chat"`.

`ChatView.js` owns its own state: `messages` (chat history), `feedback` (array of `{ id, forMessage, text, loading }`, appended optimistically and filled in async/in parallel with the main reply), and `model` (persisted in `localStorage` under `MODEL_STORAGE_KEY`, default `"llama3.2"`, editable via a text input in the chat header). The feedback panel is a fixed sidebar on desktop (`.feedback-panel`) and a bottom-sheet drawer opened via a floating 📝 button on mobile (`@media max-width: 768px`).

### Deck Building

`buildDeck()` runs whenever `cards`, `filter`, or `shuffle` changes. It filters by category, optionally shuffles with `Array.sort(() => Math.random() - 0.5)`, and resets `currentIdx` and `flipped`.

### Edit Flow

`startEdit(card)` populates the Add form and sets `view` to `"add"`. On save, the card is updated in-place by `id` matching. Legacy cards may have a single `example` string field instead of the `examples` array — handled by `card.example ? [card.example, "", "", "", ""] : ["", "", "", "", ""]`.

### Pronunciation (Web Speech API)

Both card faces include playback (🔊) and recognition (🎤) controls, built on the browser's native Web Speech API — no dependencies, no backend.

- `speakText(text, e)` — module-level helper; uses `SpeechSynthesisUtterance` with `lang = "en-US"` to read the word (front/back) or any individual example sentence (back, one button per example).
- `practicePronunciation(e)` — uses `SpeechRecognitionAPI` (`window.SpeechRecognition || window.webkitSpeechRecognition`, resolved once at module scope) to capture the spoken word and compare it against `current.word` (case-insensitive, trimmed).
- `pronunciationResult` state — `{ type: "match" | "no-match" | "error" | "unsupported", heard?, expected? }`, rendered as inline ✅/❌ feedback on the card front. Reset via `useEffect` whenever `current?.id` changes.
- `listening` state — drives the "🎙️ Escuchando..." hint and a pulse animation on the mic button while recognition is active.
- All pronunciation buttons call `e.stopPropagation()` so they don't trigger the card flip.
- `SpeechRecognition` requires a Chromium-based browser and microphone permission; Firefox is unsupported and falls back to the `"unsupported"` feedback message.

## Styling System

CSS variables in `:root` (App.css):

- `--bg #0d0f14` — dark background
- `--accent #e8c97a` — warm gold accent
- `--accent2 #7a9ce8` — cool blue accent
- `--known #52d68a` — green for mastered cards
- `--learning #e89a7a` — orange for cards under review
- `--radius 16px` — standard card border radius

**Category colors** are hardcoded in the `categoryColors` object inside App.js. Any category not listed falls back to `#D5D8DC` (gray). Current categories: Expresiones, Verbos, Sustantivos, Adjetivos, Alta frecuencia, Phrasal Verbs, Grimm.

Mobile breakpoint: `@media (max-width: 480px)`. The chat/feedback layout additionally collapses at `@media (max-width: 768px)`.

## Card Data Shape

```js
{
  id: number,           // unique; use Date.now() for user-created cards
  type: "word" | "phrasal",
  word: string,
  meaning: string,
  examples: string[],  // up to 5 items
  category: string     // must exist in categoryColors or will render gray
}
```

To add pre-installed vocabulary, edit `src/data.js` and ensure the category is registered in the `categoryColors` object in App.js.
