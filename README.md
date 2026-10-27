# FlashCine — Aprende inglés con el vocabulario de tus películas y series

App de flashcards para aprender inglés de forma activa. Incluye 503 tarjetas preinstaladas con vocabulario real de películas, series y conversaciones cotidianas.

## Demo rápida

| Estudiar | Lista | Añadir |
|----------|-------|--------|
| Voltea la tarjeta para ver el significado | Gestiona todo tu vocabulario en una tabla | Añade palabras con significado y hasta 5 ejemplos |

## Características

- **Modo Estudio** — tarjetas con animación de volteo, navegación manual y marcado de progreso
- **Pronunciación** — 🔊 *Escuchar* (Web Speech API) y 🎤 *Practicar* con reconocimiento de voz (✅/❌)
- **Progreso por tarjeta** — marca cada palabra como *Dominada* o *Repasar*
- **Filtro por categoría** — Alta frecuencia, Phrasal Verbs, Expresiones, Verbos, Sustantivos, Adjetivos, Grimm...
- **Barajar** — aleatoriza el mazo con un clic
- **Vista Lista** — tabla con edición, borrado y estado de progreso
- **Añadir vocabulario** — formulario con palabra, significado, hasta 5 ejemplos y categoría personalizable
- **Persistencia automática** — SQLite (sql.js) embebida en el navegador, persistida en IndexedDB
- **Conversar con IA** — chat en inglés con Ollama; feedback gramatical en paralelo

## Vocabulario incluido (503 tarjetas)

| Categoría | Descripción |
|-----------|-------------|
| Phrasal Verbs | 216 phrasal verbs
| Expresiones | 94 frases hechas y coloquialismos
| Verbos | 69 verbos
| Sustantivos | 33 sustantivos
| Adjetivos | 31 adjetivos
| Breaking Bad | 18 términos de la serie
| Alta frecuencia | 14 palabras imprescindibles del inglés cotidiano
| Náutico | 12 términos náuticos
| Sugar, Prompting / IA, The Undeclared War, Grimm, The Instigators, Historia | 16 términos temáticos

## Instalación

> 📘 Guía completa paso a paso (Git, Node.js, Ollama, solución de problemas): **[INSTALACION.md](INSTALACION.md)**

```bash
cd flashcards-app
npm install
npm start
```

La app abre en `http://localhost:3000`.

## Stack

- **React 18** — interfaz de usuario
- **CSS3** — tema oscuro con variables CSS, animaciones 3D para el volteo de tarjetas
- **sql.js + IndexedDB** — persistencia cliente sin backend
- **Create React App** — bundling y entorno de desarrollo

## Estructura del proyecto

```
flascards-ingles-app/
├── flashcards-app/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── constants/
│       │   └── categories.js      # colores y categorías (OCP)
│       ├── services/
│       │   └── speech.js          # Web Speech API
│       ├── hooks/
│       │   ├── useCards.js        # tarjetas + CRUD
│       │   ├── useDeck.js         # mazo + navegación
│       │   └── usePronunciation.js# reconocimiento de voz
│       ├── views/
│       │   ├── StudyView.js       # vista de estudio
│       │   ├── ListView.js        # lista de vocabulario
│       │   └── AddView.js         # formulario añadir/editar
│       ├── App.js                 # orquestador de vistas
│       ├── App.css                # estilos globales
│       ├── ChatView.js            # vista de conversación (Ollama)
│       ├── data.js                # 122 tarjetas iniciales
│       ├── db.js                  # capa SQLite/sql.js
│       ├── index.js               # punto de entrada React
│       └── ollama.js              # cliente HTTP Ollama
└── README.md
```

La arquitectura sigue principios SOLID. Ver `CLAUDE.md` para documentación técnica completa.
