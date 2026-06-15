# Prompt para Claude Code CLI

Copia y pega esto completo en Claude Code, dentro de la carpeta `flashcards-app`:

---

Quiero añadir dos funcionalidades importantes a mi app de flashcards React (`flashcards-app`):

## 1. Importar vocabulario desde JSON

Añade un botón "Importar JSON" en la vista de Vocabulario (lista) que permita al usuario seleccionar un archivo `.json` desde su dispositivo.

**Formato esperado del JSON** (array de objetos):
```json
[
  {
    "word": "Bounty",
    "meaning": "Recompensa / Prima / Botín",
    "category": "Breaking Bad",
    "examples": [
      "There's a bounty on his head.",
      "Such a large bounty.",
      "The bounty of nature."
    ]
  }
]
```

**Lógica de fusión al importar:**
- Busca coincidencias por `word` (case-insensitive, ignorando espacios extra).
- **Si la palabra YA EXISTE**:
  - Fusiona los `examples` nuevos con los existentes.
  - Evita duplicados (compara strings normalizados: lowercase + trim).
  - Limita el total a un máximo de 8 ejemplos por tarjeta (los más recientes tienen prioridad si se supera el límite).
  - Si el `meaning` nuevo aporta información distinta, añádelo como alternativa separado por " / " (sin duplicar si ya está contenido).
- **Si la palabra NO EXISTE**:
  - Crea una tarjeta nueva con un id autogenerado (timestamp + índice para evitar colisiones en imports masivos).
  - Si falta `category`, usa "Sin categoría".
  - Si faltan `examples`, usa array vacío.
- Tras importar, muestra un resumen: "X palabras nuevas añadidas, Y palabras actualizadas con nuevos ejemplos".
- Maneja errores de parseo de JSON con un mensaje claro al usuario (no debe romper la app).

## 2. Persistencia en base de datos local (SQLite vía sql.js o similar)

Sustituye la persistencia actual basada en `localStorage` por una base de datos SQLite ligera que viva en el navegador:

- Usa **sql.js** (SQLite compilado a WebAssembly) o **better-sqlite3** si decides mover la persistencia a un pequeño backend local con Node/Express — elige la opción que requiera menos configuración para una app puramente frontend (recomiendo sql.js + persistencia del binario en IndexedDB para que sobreviva entre sesiones).

**Esquema de la base de datos:**

```sql
CREATE TABLE cards (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'word',
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Sin categoría',
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  example_text TEXT NOT NULL,
  position INTEGER DEFAULT 0
);

CREATE TABLE progress (
  card_id INTEGER PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  status TEXT CHECK(status IN ('known','learning')) NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);
```

**Requisitos:**
- Al arrancar la app por primera vez, crea la base de datos y la **siembra (`seed`) con el contenido actual de `src/data.js`** (no lo borres, úsalo como datos iniciales si la DB está vacía).
- Toda operación de la app (añadir, editar, borrar, marcar progreso, importar JSON) debe leer/escribir en SQLite, no en `localStorage`.
- Persiste el binario de la base de datos en **IndexedDB** después de cada cambio (debounced, no en cada tecla) para que sobreviva entre sesiones del navegador.
- Añade un botón "Exportar base de datos" que descargue el archivo `.sqlite` actual, y otro "Exportar vocabulario a JSON" que genere un JSON con el mismo formato esperado para importar (para poder hacer backups/compartir vocabulario).

## Notas generales

- Mantén el estilo visual oscuro/cinematográfico existente.
- No rompas las funcionalidades actuales: estudiar con flip de tarjetas, filtros por categoría, modo aleatorio, marcar dominada/repasar, añadir/editar/borrar tarjetas.
- Si usas sql.js, recuerda que necesita cargar el archivo `.wasm` — configúralo correctamente con el bundler de Create React App (copiarlo a `public/` si es necesario).
- Documenta en el README cómo importar un JSON y el formato esperado.

---
