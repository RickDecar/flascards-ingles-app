# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FlashCine** is a React 18 SPA for learning English vocabulary through interactive flashcards. It ships with 122 pre-installed cards (movies/series vocabulary, phrasal verbs, high-frequency words). All data persists client-side via localStorage.

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

The entire app lives in `flashcards-app/src/App.js` as one monolithic React component. All state, handlers, and JSX are co-located there. `App.css` holds all styling. `data.js` exports the `initialCards` array (100 pre-installed vocabulary objects).

**Key state in App.js:**

| State | Type | Purpose |
|-------|------|---------|
| `cards` | array | All cards (initialCards + user-created) |
| `progress` | object | `{ cardId: "known" \| "learning" }` |
| `view` | string | `"study"` \| `"add"` \| `"list"` |
| `filter` | string | Active category filter |
| `deck` | array | Filtered/shuffled cards for current session |
| `currentIdx` | number | Index into deck |
| `flipped` | boolean | Card face state |

### Three Views

1. **Study** — one card at a time, flip animation, mark known/learning, navigate deck
2. **List** — grid of all cards with edit/delete and progress pills
3. **Add** — form to create or edit cards (supports on-the-fly new categories)

### Data Persistence (localStorage)

- `english_flashcards_user` — user-created cards only (initialCards are hardcoded)
- `english_flashcards_progress` — learning progress object

Both are saved via `useEffect` watching their respective state values.

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

Mobile breakpoint: `@media (max-width: 480px)`.

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
