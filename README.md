# FlashCine — Aprende inglés con el vocabulario de tus películas y series

App de flashcards para aprender inglés de forma activa. Incluye 122 tarjetas preinstaladas con vocabulario real de películas, series y conversaciones cotidianas.

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

## Vocabulario incluido (122 tarjetas)

| Categoría | Descripción |
|-----------|-------------|
| Phrasal Verbs | 101 phrasal verbs esenciales |
| Alta frecuencia | 12 palabras imprescindibles del inglés cotidiano |
| Verbos | 3 verbos |
| Expresiones | 2 frases hechas y coloquialismos |
| Sustantivos | 2 sustantivos |
| Adjetivos | 1 adjetivo |
| Grimm | 1 término de la serie *Grimm* |

## Instalación

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
