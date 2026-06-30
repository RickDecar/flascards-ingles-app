# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**FlashCine** is a React 18 SPA for learning English vocabulary through interactive flashcards. Ships with 122 pre-installed cards (movies/series vocabulary, phrasal verbs, high-frequency words). All data persists client-side in a SQLite database (sql.js) stored in IndexedDB.

**Tech Stack**: React 18, CSS3 (CSS variables + dark theme), JavaScript ES6+, Create React App (react-scripts 5).

## Development Commands

All commands run from `flashcards-app/`:

```bash
npm install       # install dependencies
npm start         # dev server at http://localhost:3000
npm run build     # production build
```

No test suite is configured.

## Architecture — SOLID

The codebase follows SOLID principles. Each module has a single, well-defined responsibility.

```
flashcards-app/src/
├── constants/
│   └── categories.js        # CATEGORY_COLORS, DEFAULT_CATEGORIES, getCategoryColor
├── services/
│   └── speech.js            # speakText, SpeechRecognitionAPI (Web Speech API)
├── hooks/
│   ├── useCards.js          # estado de tarjetas + CRUD (initDB, add, update, delete, markProgress, toggleIncidir, import/export)
│   ├── useDeck.js           # construcción del mazo + navegación (filter, shuffle, incidirMode, flip, navigate)
│   └── usePronunciation.js  # reconocimiento de voz (SpeechRecognition lifecycle)
├── views/
│   ├── StudyView.js         # UI de la vista de estudio (usa usePronunciation internamente)
│   ├── ListView.js          # UI de vocabulario (tabla, import/export con download)
│   └── AddView.js           # formulario crear/editar tarjeta (estado de formulario interno)
├── App.js                   # orquestador: routing de vistas + composición de hooks
├── App.css                  # todos los estilos
├── ChatView.js              # vista conversar con Ollama (estado propio)
├── data.js                  # 122 tarjetas iniciales (seed)
├── db.js                    # capa SQLite/sql.js (tablas: cards, examples, progress); incluye migrateDB()
├── index.js                 # punto de entrada React
└── ollama.js                # cliente HTTP Ollama (sendChatMessage, getFeedback)
```

### Principios aplicados

| Principio | Aplicación |
|-----------|------------|
| **SRP** | Cada archivo tiene una única razón de cambio. `App.js` solo orquesta vistas; los hooks encapsulan lógica de negocio; las vistas encapsulan UI. |
| **OCP** | `constants/categories.js` permite agregar colores/categorías sin tocar `App.js` ni las vistas. |
| **LSP** | No aplica directamente (no hay herencia de clases), pero los hooks respetan contratos de retorno estables. |
| **ISP** | Cada vista recibe solo los props que necesita; `StudyView` no conoce las funciones de importación/exportación. |
| **DIP** | `App.js` depende de abstracciones (`useCards`, `useDeck`), no de `db.js` directamente. `ChatView` depende de `ollama.js` como servicio. |

### Flujo de datos

```
db.js (SQLite)
    ↑ import
useCards.js (hook) ──→ App.js (orquestador) ──→ StudyView.js
useDeck.js  (hook) ──↗                      ├──→ ListView.js
                                             ├──→ AddView.js
                                             └──→ ChatView.js
                                                      ↑
                                               ollama.js (servicio)
```

### App.js como orquestador puro

`App.js` solo hace tres cosas:
1. Componer `useCards` y `useDeck` en estado compartido
2. Definir handlers de coordinación entre vistas (`handleSaveCard`, `handleStartEdit`, `handleAddNew`)
3. Renderizar la cabecera + la vista activa según `view`

No contiene lógica de negocio, no accede a `db.js` directamente, no gestiona formularios.

Estado propio de `App.js`: `view`, `filter`, `shuffled`, `incidirMode`, `editCard`, `recentWords`.

### Data Persistence (SQLite via sql.js)

`src/db.js` — tablas: `cards`, `examples`, `progress`. En primera carga siembra la BD desde `initialCards` (`data.js`). Cada mutación debouncea un export binario a IndexedDB (`flashcards_sqlite`). `useCards` abstrae toda la interacción con `db.js`.

`migrateDB()` se ejecuta al cargar una BD existente y añade columnas nuevas con `ALTER TABLE … ADD COLUMN` dentro de un try/catch (idempotente). Añadir un campo nuevo a `cards` requiere: (1) declararlo en `SCHEMA_SQL`, (2) añadirlo en `migrateDB()`, (3) leerlo en `getAllCards()`, (4) exponerlo en el hook `useCards`.

### Conversation (Ollama)

`src/ollama.js` — cliente HTTP para `http://localhost:11434/api/chat`. `ChatView.js` gestiona su propio estado (`messages`, `feedback`, `model` en localStorage). Dos llamadas paralelas por turno: `sendChatMessage` (conversación) y `getFeedback` (análisis gramatical). Ambas lanzan `CONNECTION_ERROR_MESSAGE` si Ollama no está disponible.

### Añadir una nueva categoría

1. Añadir entrada en `CATEGORY_COLORS` en `constants/categories.js` — ningún otro archivo necesita cambios.

### Añadir una nueva vista

1. Crear `src/views/MiVista.js`
2. Importarla en `App.js` y añadir `{view === "mi-vista" && <MiVista ... />}`
3. Añadir botón en el `<nav>` de `App.js`

### Card Data Shape

```js
{
  id: number,           // único; Date.now() para tarjetas del usuario
  type: "word" | "phrasal",
  word: string,
  meaning: string,
  examples: string[],  // hasta 5 (importación acepta hasta 8)
  category: string,    // debe existir en CATEGORY_COLORS o renderiza en gris
  incidir: boolean     // marca la tarjeta para repaso con "Insistir"; persiste en SQLite
}
```

### Modo "Insistir" (incidirMode)

`StudyView` muestra en cada tarjeta un checkbox "Insistir en esta tarjeta" (esquina inferior izquierda de la cara frontal). Al activarlo, `useCards.toggleIncidir` llama a `db.setIncidir` y actualiza el estado React de forma atómica.

El botón "Revisar tarjetas con insistir activo" en los controles de estudio activa `incidirMode` en `App.js`, que se pasa a `useDeck`. Con `incidirMode = true`, `useDeck` filtra el mazo a las tarjetas con `incidir === true`. Si el mazo resultante está vacío, `StudyView` muestra un mensaje contextual en lugar de una lista vacía.

## Styling System

CSS variables en `:root` (App.css):
- `--bg #0d0f14` — fondo oscuro
- `--accent #e8c97a` — dorado cálido
- `--accent2 #7a9ce8` — azul frío
- `--known #52d68a` — verde (dominadas)
- `--learning #e89a7a` — naranja (repasando)
- `--radius 16px` — borde estándar de tarjetas

Breakpoints: `@media (max-width: 480px)` general; `@media (max-width: 768px)` chat/feedback.
