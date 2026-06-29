# FlashCine — English Flashcards

App de flashcards para aprender inglés con el vocabulario de tus películas y series.

## Instalar y arrancar

```bash
cd flashcards-app
npm install
npm start
```

La app abre en `http://localhost:3000`

## Funcionalidades

- **Estudiar**: Repasa las tarjetas, gíralas para ver el significado
- **Pronunciación**: 🔊 Escuchar la palabra/ejemplos (Web Speech API) y 🎤 Practicar pronunciación con reconocimiento de voz
- **Marcar progreso**: ✓ Dominada / ↻ Repasar
- **Filtrar por categoría**: Alta frecuencia, Phrasal Verbs, Expresiones, Grimm...
- **Aleatorio**: Baraja el mazo
- **Añadir vocabulario**: Añade nuevas palabras con significado y ejemplo
- **Editar / Borrar**: Gestiona tu vocabulario desde la vista Lista
- **Persistencia**: Base de datos SQLite (sql.js) embebida en el navegador, persistida en IndexedDB
- **Conversar**: chatea en inglés con un modelo local de Ollama, que intenta usar tu vocabulario reciente y te da feedback de tus mensajes

## Importar vocabulario desde JSON

En la vista **Vocabulario**, pulsa **📥 Importar JSON** y selecciona un archivo `.json`:

```json
[
  {
    "word": "Bounty",
    "meaning": "Recompensa / Prima / Botín",
    "category": "Breaking Bad",
    "examples": [
      "There's a bounty on his head.",
      "Such a large bounty."
    ]
  }
]
```

- `category` y `examples` son opcionales.
- Palabras existentes: se añaden ejemplos nuevos (sin duplicados, máx. 8) y se fusionan significados distintos.
- Al terminar se muestra un resumen o un error si el JSON no es válido.

## Exportar / Backup

- **🗄️ Exportar base de datos**: descarga el archivo `.sqlite` completo.
- **📤 Exportar vocabulario a JSON**: descarga un `.json` en el mismo formato de importación.

## Vocabulario incluido

122 tarjetas preinstaladas: 101 phrasal verbs esenciales, 12 palabras de alta frecuencia, expresiones, verbos, sustantivos, adjetivos y vocabulario de *Grimm*.

## Conversar con IA (Ollama)

```bash
ollama serve              # arranca el servidor en http://localhost:11434
ollama pull llama3.2      # descarga el modelo recomendado (solo la primera vez)
```

El chat envía tus mensajes a Ollama, que responde en inglés con frases cortas e intenta usar palabras que hayas estudiado recientemente. El feedback gramatical se genera en paralelo y aparece en un panel aparte (escritorio) o en un drawer flotante (móvil).

Por defecto usa `llama3.2`. Puedes cambiarlo desde el campo "Modelo Ollama" en la cabecera de la vista Conversar.

## Estructura del proyecto

```
flashcards-app/src/
├── constants/
│   └── categories.js        # colores y lista de categorías (OCP)
├── services/
│   └── speech.js            # Web Speech API (síntesis + reconocimiento)
├── hooks/
│   ├── useCards.js          # estado de tarjetas + CRUD + import/export
│   ├── useDeck.js           # mazo filtrado/barajado + navegación
│   └── usePronunciation.js  # ciclo de vida del reconocimiento de voz
├── views/
│   ├── StudyView.js         # vista de estudio con flip de tarjeta
│   ├── ListView.js          # tabla de vocabulario con import/export
│   └── AddView.js           # formulario crear/editar tarjeta
├── App.js                   # orquestador: routing + composición de hooks
├── App.css                  # todos los estilos
├── ChatView.js              # vista de conversación con Ollama
├── data.js                  # 122 tarjetas iniciales (seed)
├── db.js                    # capa SQLite/sql.js (IndexedDB)
├── index.js                 # punto de entrada React
└── ollama.js                # cliente HTTP Ollama
```

La arquitectura sigue principios SOLID: cada módulo tiene una única responsabilidad, las vistas reciben solo los props que necesitan, y añadir categorías o vistas nuevas no requiere modificar el núcleo de la app.
