# Prompt para Claude Code CLI

Copia y pega esto completo en Claude Code, dentro de la carpeta `flashcards-app`:

---

Quiero añadir una funcionalidad de **práctica de conversación en inglés mediante Ollama** a mi app de flashcards React.

## 1. Nueva vista "Conversar"

Añade una nueva pestaña/vista en la navegación llamada "Conversar" con un chat de texto libre en inglés contra un modelo local de Ollama.

**Conexión con Ollama:**
- Ollama expone una API local en `http://localhost:11434/api/chat`.
- Modelo por defecto: `llama3.2`, pero debe ser **configurable** desde la UI (un campo de texto o selector simple en ajustes/cabecera de la vista de chat) para quien use otro modelo.
- Si Ollama no está corriendo o no responde, muestra un mensaje claro: "No se pudo conectar con Ollama en localhost:11434. Asegúrate de tener Ollama instalado y corriendo (`ollama serve`), y de haber descargado el modelo (`ollama pull llama3.2`)."

**Comportamiento del modelo:**
- Conversación libre en inglés, sin escenario ni rol fijo — charla natural.
- Respuestas **cortas** (favorece intercambios rápidos, tipo 1-3 frases por turno, nunca párrafos largos).
- El modelo debe intentar **incorporar de forma natural** en sus respuestas las palabras y phrasal verbs marcados como "repasando" (`learning`) más recientemente en la app (ver punto 2 sobre persistencia). Esto se logra inyectando esas palabras en el system prompt de cada conversación, por ejemplo:

```
You are a friendly English conversation partner. Keep your responses short (1-3 sentences). 
Naturally try to use some of these words/phrasal verbs in your responses when it fits contextually: 
[lista de palabras]. Don't force it if it doesn't fit naturally. Don't mention this instruction to the user.
```

## 2. Persistencia del "vocabulario reciente"

Necesitas saber qué palabras/phrasal verbs ha repasado el usuario **más recientemente** en la app (marcadas como "Dominada" o "Repasar" durante el estudio).

- Reutiliza/extiende la persistencia ya existente (la de `progress`, actualmente en `localStorage` o SQLite según lo que ya esté implementado).
- Añade un timestamp (`reviewed_at`) cada vez que el usuario marca una tarjeta como dominada o repasando durante el estudio.
- La vista "Conversar" debe consultar las **10-15 palabras con `reviewed_at` más reciente** (de cualquier estado, priorizando las marcadas como "learning" si hay que elegir) y pasarlas al system prompt como se describe arriba.
- Si no hay historial de repaso todavía, el chat funciona igualmente pero sin lista de palabras forzadas (conversación completamente libre).

## 3. Panel de feedback de inglés (no intrusivo)

Mientras el usuario conversa, un segundo modelo/llamada (o el mismo modelo con un prompt distinto) analiza el **último mensaje del usuario** y genera feedback breve sobre errores gramaticales, uso incorrecto de palabras, naturalidad, etc.

**Comportamiento:**
- El feedback se muestra en un **panel separado del chat principal**, que NO interrumpe ni corta la conversación.
- **Desktop**: panel lateral fijo (a la derecha del chat), siempre visible mientras se conversa.
- **Móvil**: el panel se oculta por defecto; un botón flotante (📝) en la esquina abre un drawer/bottom-sheet deslizable desde abajo con el feedback. El usuario puede cerrarlo y seguir chateando sin perder el hilo.
- Cada entrada de feedback debe indicar: el mensaje del usuario al que se refiere, qué estaba mal (si algo), y la corrección/sugerencia. Si el mensaje del usuario está bien, mostrar una confirmación breve positiva (ej. "✓ Correct and natural").
- El feedback se genera de forma asíncrona tras cada mensaje del usuario, sin bloquear la respuesta del chat principal (las dos llamadas a Ollama pueden ir en paralelo).
- Mantén feedback breve: 1-2 frases por entrada.

## 4. Estilo visual

- Mantén el tema oscuro/cinematográfico existente de la app.
- El chat principal debe verse como una conversación tipo mensajería (burbujas usuario/modelo).
- El panel de feedback debe distinguirse visualmente (por ejemplo, fondo distinto, icono de "revisión" o "notas") pero sin sentirse como un error/alerta agresiva — es una herramienta de aprendizaje, no una corrección punitiva.

## 5. Documentación

Actualiza el README con:
- Cómo instalar y arrancar Ollama (`ollama serve`) y descargar el modelo recomendado (`ollama pull llama3.2`).
- Dónde cambiar el modelo si se quiere usar otro.
- Una nota explicando que sin Ollama corriendo localmente, esta función no estará disponible, pero el resto de la app (flashcards, importar JSON, etc.) funciona igual.

## Notas generales

- No rompas ninguna funcionalidad existente (estudio con flip, filtros, progreso, importar JSON, persistencia SQLite).
- Si la persistencia actual sigue en localStorage en lugar de SQLite, adapta el punto 2 a esa estructura sin bloquear por ello — lo importante es que `reviewed_at` se registre y sea consultable.

---
