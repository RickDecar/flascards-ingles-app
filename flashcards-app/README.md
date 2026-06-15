# FlashCine — English Flashcards

App de flashcards para aprender inglés con el vocabulario de tus películas y series.

## Cómo usar

### Instalar y arrancar

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
- **Persistencia**: Todo se guarda en una base de datos SQLite (sql.js) embebida en el navegador, cuyo binario se persiste en IndexedDB tras cada cambio
- **Conversar**: chatea en inglés con un modelo local de Ollama, que intenta usar tu vocabulario reciente y te da feedback de tus mensajes

## Importar vocabulario desde JSON

En la vista **Vocabulario**, pulsa **📥 Importar JSON** y selecciona un archivo `.json` con un array de tarjetas en este formato:

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

- `category` y `examples` son opcionales: si faltan, se usa "Sin categoría" y `[]` respectivamente.
- Las palabras se comparan ignorando mayúsculas/minúsculas y espacios.
- Si la palabra **ya existe**: los nuevos ejemplos se añaden a los existentes (sin duplicados, máximo 8, los más recientes tienen prioridad si se supera el límite) y, si el significado nuevo aporta información distinta, se añade como alternativa separado por " / ".
- Si la palabra **no existe**: se crea una tarjeta nueva.
- Al terminar se muestra un resumen ("X palabras nuevas añadidas, Y palabras actualizadas con nuevos ejemplos") o un error si el archivo no es un JSON válido.

## Exportar / Backup

- **🗄️ Exportar base de datos**: descarga el archivo `.sqlite` completo (cards, ejemplos y progreso).
- **📤 Exportar vocabulario a JSON**: descarga un `.json` con el mismo formato esperado por la importación, listo para compartir o reimportar.

## Vocabulario incluido

122 tarjetas preinstaladas:
- 101 phrasal verbs esenciales
- 12 palabras de alta frecuencia
- Resto: expresiones, verbos, sustantivos, adjetivos y vocabulario de la serie *Grimm*

## Añadir categorías personalizadas

En el formulario de nueva tarjeta, selecciona "+ Nueva categoría..." para crear las tuyas.

## Conversar con IA (Ollama)

La vista **Conversar** permite practicar inglés charlando libremente con un modelo local a través de [Ollama](https://ollama.com).

### Instalar y arrancar Ollama

```bash
ollama serve              # arranca el servidor local en http://localhost:11434
ollama pull llama3.2      # descarga el modelo recomendado (solo la primera vez)
```

### Cómo funciona

- El chat envía tus mensajes a `http://localhost:11434/api/chat`.
- El modelo responde en inglés con frases cortas (1-3 frases) y, cuando viene a cuento, intenta usar palabras o phrasal verbs que hayas marcado recientemente como "Dominada" o "Repasar" en la app.
- Tras cada mensaje tuyo, un segundo análisis (en paralelo, sin bloquear la conversación) genera feedback breve sobre gramática, vocabulario o naturalidad, mostrado en un panel aparte:
  - **Escritorio**: panel fijo a la derecha del chat.
  - **Móvil**: botón flotante 📝 que abre un panel deslizable desde abajo.

### Cambiar de modelo

Por defecto se usa `llama3.2`. Puedes cambiarlo escribiendo el nombre de cualquier otro modelo que tengas descargado (ej. `mistral`, `llama3.1`) en el campo "Modelo Ollama" de la cabecera de la vista Conversar — se recuerda entre sesiones.

### Si Ollama no está disponible

Si Ollama no está corriendo o no responde, la vista Conversar muestra un mensaje explicando cómo arrancarlo y descargar el modelo. El resto de la app (flashcards, importar/exportar JSON, persistencia SQLite, etc.) funciona con normalidad sin Ollama.
