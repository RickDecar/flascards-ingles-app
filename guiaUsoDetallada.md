# Uso de FlashCine: guía funcional completa de una aplicación de flashcards con práctica oral y conversación asistida por IA local

**Tipo de documento:** guía de uso (how-to) con estructura de artículo de investigación
**Proyecto:** FlashCine, aplicación web para aprender vocabulario en inglés
**Repositorio:** https://github.com/RickDecar/flascards-ingles-app
**Prerrequisito:** aplicación instalada y en marcha (ver `guiaInstalacionDetallada.md`)

---

## Resumen

FlashCine integra cuatro vistas (**Estudiar**, **Vocabulario**, **Añadir/Editar** y **Conversar**) y un conjunto de servicios transversales (síntesis y reconocimiento de voz, persistencia en SQLite dentro del navegador e inferencia con un modelo de lenguaje local). Esta guía describe **todas las funcionalidades** de la aplicación, explica el comportamiento exacto de cada control tal como está implementado en el código, ofrece procedimientos paso a paso, define el formato de los datos de entrada y salida, propone un protocolo de estudio y documenta las limitaciones detectadas. Cada afirmación sobre el comportamiento procede de la lectura del código fuente (`App.js`, `views/`, `hooks/`, `db.js`, `ollama.js`, `ChatView.js`). Los casos marcados con 🔎 se deducen del código y **no se han probado en ejecución**.

**Palabras clave:** flashcards, vocabulario, Web Speech API, SQLite, IndexedDB, Ollama, práctica de pronunciación, feedback gramatical.

---

## 1. Introducción

### 1.1 Problema y enfoque

Aprender vocabulario con listas estáticas favorece el reconocimiento pasivo pero no la producción. FlashCine combina cuatro actividades en una sola herramienta:

1. **Recuperación activa:** ver la palabra y recordar el significado antes de voltear la tarjeta.
2. **Producción oral:** escuchar el modelo de pronunciación y comparar con la propia voz.
3. **Autoevaluación:** marcar cada tarjeta como *Dominada* o *Repasar*, y reforzar las difíciles con *Insistir*.
4. **Uso en contexto:** conversar con una IA que intenta reutilizar las palabras recién repasadas y corrige cada mensaje.

### 1.2 Mapa de funcionalidades

| Área | Funciones |
|---|---|
| **Estudiar** | Volteo de tarjeta, navegación, progreso, filtro por categoría, modo aleatorio, modo Insistir, reinicio, estadísticas, escucha de palabra y ejemplos, práctica de pronunciación |
| **Vocabulario** | Lista completa, filtro, editar, borrar, importar JSON, exportar base de datos, exportar vocabulario a JSON |
| **Añadir / Editar** | Formulario con palabra, significado, hasta 5 ejemplos y categoría |
| **Conversar** | Chat en inglés con Ollama, entrada por voz, lectura automática, panel de feedback, selector de modelo, integración con las palabras repasadas |
| **Transversal** | Persistencia automática, categorías con color, tema oscuro, diseño adaptable |

### 1.3 Convenciones de este documento

- **[Botón]** designa un control de la interfaz con su texto real.
- ✅ marca el resultado esperado de un procedimiento.
- ⚠️ marca una advertencia sobre pérdida de datos o comportamiento no obvio.
- 🔎 marca un comportamiento deducido del código y no probado.

---

## 2. Marco conceptual

### 2.1 El modelo de datos

Cada tarjeta se compone de:

| Campo | Descripción | Origen en la interfaz |
|---|---|---|
| `id` | Entero único. Las tarjetas semilla usan ids fijos; las creadas por el usuario usan `Date.now()` | Automático |
| `type` | `"word"` o `"phrasal"` (en las tarjetas del usuario es siempre `"word"`) | Automático |
| `word` | Palabra o expresión en inglés | Formulario |
| `meaning` | Significado en español | Formulario |
| `examples` | Lista de ejemplos de uso, ordenada | Formulario (hasta 5); importación (hasta 8) |
| `category` | Etiqueta de agrupación | Formulario |
| `incidir` | Marca "Insistir" (verdadero/falso) | Casilla en la tarjeta |

Aparte, cada tarjeta puede tener un **estado de progreso** (`known` o `learning`) con marca de tiempo, almacenado en otra tabla. Una tarjeta nunca revisada no tiene estado.

### 2.2 Estado de aprendizaje: tres señales independientes

| Señal | Qué expresa | Dónde se cambia | Efecto |
|---|---|---|---|
| **Dominada** (`known`) | La recuerdas bien | [✓ Dominada] | Cuenta en el contador verde |
| **Repasar** (`learning`) | Necesita más práctica | [↻ Repasar] | Cuenta en el contador naranja |
| **Insistir** (`incidir`) | Quieres forzar su repaso en un mazo propio | Casilla "Insistir en esta tarjeta" | Entra en el mazo del modo Insistir |

Son independientes: una tarjeta puede estar *Dominada* e *Insistir* a la vez.

### 2.3 Persistencia

Los datos se guardan en una base de datos SQLite (sql.js, WebAssembly) que se serializa a **IndexedDB** del navegador (base `flashcards_sqlite`). Cada cambio programa un guardado diferido de **800 ms**. En la primera carga se siembra la base con las 503 tarjetas iniciales. Las cargas siguientes leen la base guardada, y los cambios posteriores en el archivo de datos inicial no se reflejan.

Consecuencia práctica: los datos pertenecen al **origen** `http://localhost:3000` de **ese navegador**.

---

## 3. Visión general de la interfaz

### 3.1 Pantalla de carga

Al abrir la app se muestra "Cargando base de datos…" hasta que sql.js y la base están listas.

### 3.2 Cabecera y navegación

La cabecera muestra el logotipo y cuatro botones:

| Botón | Acción |
|---|---|
| **Estudiar** | Abre la vista de estudio (vista por defecto) |
| **Vocabulario** | Abre la lista |
| **Conversar** | Abre el chat |
| **+ Añadir** | Abre el formulario en modo "Nueva tarjeta" |

El botón de la vista activa aparece resaltado. La vista de formulario (Añadir/Editar) no tiene un botón de navegación propio resaltado.

### 3.3 Estado compartido entre vistas

El **filtro de categoría** es único y compartido por **Estudiar** y **Vocabulario**: si filtras por "Phrasal Verbs" en una vista, la otra también queda filtrada. Lo mismo ocurre con el modo aleatorio y el modo Insistir, que pertenecen al mazo de estudio.

---

## 4. Vista Estudiar

### 4.1 Elementos de la pantalla

De arriba abajo:

1. **Barra de estadísticas:** `✓ N dominadas`, `↻ N repasando`, `📚 N total`. Los dos primeros cuentan tarjetas con ese estado. El total es el número de tarjetas de toda la base, no del mazo filtrado.
2. **Barra de controles:** selector de categoría, [🔀 Aleatorio], [⚠️ Revisar tarjetas con insistir activo] y [↺ Reiniciar].
3. **Barra de progreso** del mazo y contador `posición / total del mazo`.
4. **Tarjeta** con dos caras.
5. **Fila de acciones:** [↻ Repasar], flechas [←] [→] y [✓ Dominada].

### 4.2 La tarjeta

**Cara frontal**
- Etiqueta de categoría con su color.
- Insignia de estado si la tarjeta ya se marcó (✓ verde o ↻ naranja).
- Casilla **"Insistir en esta tarjeta"** (esquina inferior izquierda).
- La **palabra** en inglés.
- [🔊 Escuchar] y [🎤 Practicar].
- Pista: "Toca para ver el significado".

**Cara trasera** (se muestra al pulsar sobre la tarjeta)
- Etiqueta de categoría.
- El **significado** en español.
- [🔊 palabra] para volver a escucharla.
- Cada **ejemplo** entre comillas, con su propio botón 🔊.

Pulsar sobre la tarjeta alterna entre ambas caras. Los botones y la casilla **no** voltean la tarjeta.

### 4.3 Procedimiento: sesión de estudio básica

1. Abre **Estudiar**.
2. Lee la palabra e intenta recordar el significado **antes** de voltear.
3. Pulsa la tarjeta para comprobarlo y lee los ejemplos.
4. Pulsa [✓ Dominada] si acertaste o [↻ Repasar] si no.
5. La app guarda el estado y **avanza sola** a la siguiente tarjeta (salvo en la última del mazo, donde se queda).

✅ La insignia de la tarjeta cambia y los contadores de la barra se actualizan.

### 4.4 Navegación manual

- [→] avanza y [←] retrocede sin cambiar ningún estado.
- Los botones se desactivan en los extremos del mazo.
- Al cambiar de tarjeta, la cara trasera vuelve a la frontal y la animación espera unos 150 ms.
- Los desplazamientos de las flechas se limitan al rango del mazo.

### 4.5 Filtro por categoría

El selector lista **Todas las categorías** y cada categoría que exista en ese momento en la base (incluidas las creadas por el usuario o por importación). Al cambiar de categoría el mazo se reconstruye y la posición vuelve a 1.

Categorías incluidas de serie y su color: Expresiones, Verbos, Sustantivos, Adjetivos, Alta frecuencia, Phrasal Verbs, Grimm, Breaking Bad, Náutico, Sugar, Prompting / IA, The Undeclared War, The Instigators e Historia. Cualquier otra categoría se pinta en gris (`#D5D8DC`).

### 4.6 Modo aleatorio

[🔀 Aleatorio] alterna el orden aleatorio del mazo (el botón pasa a "Aleatorio ON"). Al desactivarlo se recupera el orden original (por id). Al activarlo o desactivarlo la posición vuelve a 1.

🔎 Con el modo aleatorio activo, el mazo se vuelve a barajar cada vez que cambia la lista de tarjetas, por ejemplo al marcar o desmarcar **Insistir**. La posición se conserva, pero el orden de las tarjetas restantes puede cambiar. Si necesitas un orden estable, marca Insistir con el modo aleatorio apagado.

### 4.7 Modo Insistir

**Para qué sirve:** crear un mazo reducido con las tarjetas que más te cuestan.

Procedimiento:
1. Mientras estudias, marca la casilla **"Insistir en esta tarjeta"** en las tarjetas difíciles.
2. Pulsa [⚠️ Revisar tarjetas con insistir activo]. El botón pasa a "… ON" y el mazo queda reducido a las tarjetas marcadas.
3. Estudia como de costumbre. Para quitar una tarjeta del mazo, desmarca su casilla.
4. Pulsa de nuevo el botón para volver al mazo completo.

Comportamiento:
- Se combina con el filtro de categoría y con el modo aleatorio.
- Si no hay ninguna tarjeta marcada, se muestra: *"No tienes tarjetas marcadas para repasar. Activa el checkbox "Incidir" en las tarjetas que quieras reforzar."* (El texto del aviso dice "Incidir", mientras que la casilla se llama "Insistir"; es la misma función.)
- 🔎 Dentro del modo Insistir, al desmarcar la casilla de la tarjeta visible, esa tarjeta sale del mazo en el acto.
- La marca se guarda en la base de datos y persiste entre sesiones.

### 4.8 Reiniciar

[↺ Reiniciar] reconstruye el mazo con los filtros actuales y vuelve a la primera tarjeta. No borra progreso ni marcas. Con el modo aleatorio activo, genera un orden nuevo.

### 4.9 Escuchar la pronunciación

- **[🔊 Escuchar]** (frontal), **[🔊 palabra]** (trasera) y el **🔊** de cada ejemplo usan la síntesis de voz del navegador en `en-US`.
- Cada pulsación cancela cualquier lectura en curso antes de empezar la nueva.
- La voz concreta depende del sistema operativo y del navegador. Si el navegador no ofrece síntesis de voz, el botón no hace nada.

### 4.10 Practicar la pronunciación

Procedimiento:
1. En la cara frontal, pulsa [🎤 Practicar].
2. Concede el permiso de micrófono la primera vez.
3. Cuando aparezca "🎙️ Escuchando…", di la palabra en inglés.
4. Lee el resultado.

| Resultado | Mensaje | Significado |
|---|---|---|
| Coincide | `✅ ¡Correcto! Dijiste: "…"` | El texto reconocido coincide con la palabra |
| No coincide | `❌ Esperado: "…" — Entendí: "…"` | El texto reconocido es distinto |
| Error | "No se pudo reconocer el audio. Inténtalo de nuevo." | Silencio, permiso denegado o fallo del servicio |
| Sin soporte | "Tu navegador no soporta el reconocimiento de voz." | El navegador no incluye la API |

Detalles de la comparación:
- Se compara el texto reconocido con la palabra **sin distinguir mayúsculas ni espacios en los extremos**, y exige **igualdad exacta** del resto.
- Por eso, las tarjetas con signos de puntuación, paréntesis, barras o varias formas (por ejemplo "word / word") pueden marcarse como no coincidentes aunque la pronunciación sea buena. 🔎
- El resultado se borra al cambiar de tarjeta.
- El reconocimiento funciona mejor en Chrome o Edge y suele requerir conexión, porque estos navegadores envían el audio a un servicio de reconocimiento. Esto es independiente de Ollama, que sí es local.

### 4.11 Atajos y gestos

La app no define atajos de teclado en esta vista. Todo se controla con el ratón o el tacto.

---

## 5. Vista Vocabulario

### 5.1 Elementos

- Título "Tu vocabulario" con una insignia con el **total de tarjetas** de toda la base.
- Selector de categoría (compartido con Estudiar).
- Barra de herramientas con tres botones: [📥 Importar JSON], [🗄️ Exportar base de datos] y [📤 Exportar vocabulario a JSON].
- Lista de tarjetas (filtrada por el selector). Cada fila muestra categoría, palabra, significado, insignia de estado (✓ o ↻ si existe) y los botones [✏️] y [🗑].

### 5.2 Editar una tarjeta

1. Pulsa [✏️] en la fila.
2. Se abre el formulario precargado (ver §6).
3. Guarda con [Guardar cambios].

La edición **conserva** el estado de progreso y la marca Insistir de la tarjeta.

### 5.3 Borrar una tarjeta

Pulsa [🗑]. ⚠️ **No hay confirmación ni deshacer.** La tarjeta, sus ejemplos y su progreso se eliminan de la base. Haz una exportación antes de limpiezas masivas.

### 5.4 Importar vocabulario desde JSON

**Formato esperado:** un array de objetos.

```json
[
  {
    "word": "Figure out",
    "meaning": "Descifrar / Resolver",
    "category": "Phrasal Verbs",
    "examples": [
      "I can't figure out this puzzle.",
      "Let's figure out a plan."
    ]
  }
]
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `word` | Sí | Texto no vacío. Los elementos sin `word` válido se **ignoran en silencio** |
| `meaning` | No | Si falta en una tarjeta nueva, queda vacía |
| `category` | No | Si falta, la tarjeta recibe **"Sin categoría"** |
| `examples` | No | Array de textos. Las cadenas vacías se descartan |

Procedimiento:
1. Pulsa [📥 Importar JSON] y selecciona el archivo (`.json`).
2. Lee el mensaje de resultado: `N palabras nuevas añadidas, M palabras actualizadas con nuevos ejemplos.`
3. Cierra el mensaje con ✕.

**Reglas de fusión (anti-duplicados):**
- La coincidencia se determina por la **palabra normalizada** (sin distinguir mayúsculas, espacios recortados y espacios múltiples colapsados).
- Si la palabra **ya existe**: se añaden solo los **ejemplos nuevos** (los repetidos se ignoran) y, si el significado entrante no está ya contenido en el existente, se **concatena** con ` / `. Si tras fusionar hay más de **8 ejemplos**, se conservan los **8 últimos**.
- Si la palabra **no existe**: se crea una tarjeta nueva con tipo `word`.
- La importación **no modifica** el progreso ni la marca Insistir de las tarjetas existentes, y las tarjetas nuevas empiezan sin estado.
- Un archivo que no sea JSON válido muestra: *"No se pudo importar el archivo. Comprueba que sea un JSON válido con el formato esperado."* Un JSON que no sea un array también termina en ese mensaje.

El repositorio incluye ficheros de ejemplo listos para importar: `vocabulario.json`, `vocabulario_maestro_merged.json`, `bloque1_phrasal_verbs_esenciales.json`, `bloque2_expresiones_idioms_alta_frecuencia.json`, `bloque3_verbos_avanzados_c1.json` y otros. Revisa el contenido de cada uno antes de importarlo, porque algunos pueden solaparse.

### 5.5 Exportar

| Botón | Archivo | Contenido | Uso |
|---|---|---|---|
| [🗄️ Exportar base de datos] | `flashcards.sqlite` | Base SQLite completa: tarjetas, ejemplos, **progreso** y marcas Insistir | Copia de seguridad íntegra; inspección con herramientas SQLite |
| [📤 Exportar vocabulario a JSON] | `vocabulario.json` | Array con `word`, `meaning`, `category` y `examples` de **todas** las tarjetas | Compartir, versionar y reimportar |

⚠️ Dos matices importantes:
1. El JSON exportado **no incluye** progreso ni marca Insistir. Al reimportarlo en otra instalación se recupera el vocabulario, pero no el estado de estudio.
2. La interfaz **no ofrece importar** el archivo `.sqlite`. Sirve como copia de seguridad externa, pero restaurarla requiere herramientas ajenas a la app.
3. Ambas exportaciones ignoran el filtro de categoría: siempre se exporta todo.

---

## 6. Vista Añadir / Editar

### 6.1 Campos

| Campo | Descripción | Validación |
|---|---|---|
| Palabra / Expresión en inglés | Texto libre (ej.: "Figure out") | **Obligatorio** |
| Significado en español | Texto libre | **Obligatorio** |
| Ejemplos de uso (hasta 5) | Cinco cajas de texto | El primero se anuncia como obligatorio, pero el código solo exige palabra y significado. Las cajas vacías se descartan |
| Categoría | Selector con las categorías existentes y las predeterminadas, más "+ Nueva categoría…" | Valor por defecto: "Alta frecuencia" |

### 6.2 Crear una tarjeta

1. Pulsa [+ Añadir] en la cabecera.
2. Rellena palabra, significado, ejemplos y categoría.
3. Pulsa [Añadir tarjeta].

✅ La app vuelve a **Estudiar** y la tarjeta queda guardada. Si falta la palabra o el significado, el botón no hace nada y no aparece ningún mensaje de error.

### 6.3 Editar una tarjeta

Desde la lista, [✏️] abre el formulario con título "Editar tarjeta" y botón [Guardar cambios]. Al guardar, se reemplazan por completo los ejemplos de la tarjeta por los del formulario. [Cancelar] descarta los cambios y vuelve a Estudiar.

### 6.4 Crear una categoría nueva

El selector incluye "+ Nueva categoría…", que muestra un campo de texto para el nombre.

🔎 Según el código, al escribir la primera letra el valor de categoría deja de ser el marcador interno de "nueva categoría" y el campo de texto desaparece, de modo que solo se conserva el primer carácter escrito. **No lo he comprobado en ejecución.** Alternativa fiable: importar un JSON cuyas tarjetas incluyan el nombre de categoría deseado en `category`. Esa categoría aparece después en todos los selectores. Si lo haces, añade el color en `src/constants/categories.js` (ver §10.2).

### 6.5 Limitaciones del formulario

- El tipo (`word`/`phrasal`) no se puede elegir. Las tarjetas creadas desde la interfaz son siempre `word`.
- No hay detección de duplicados al crear a mano; solo la importación fusiona palabras repetidas.
- Un máximo de 5 ejemplos por el formulario (la importación admite hasta 8).

---

## 7. Vista Conversar

### 7.1 Propósito y funcionamiento

La vista permite practicar inglés escrito y hablado con un modelo de lenguaje que corre en tu equipo mediante Ollama. En cada mensaje se lanzan **dos peticiones en paralelo**:

1. **Conversación:** el modelo responde en tono casual, con **1 a 3 frases**, e intenta usar de forma natural las palabras que estás repasando, sin mencionar esa instrucción.
2. **Feedback:** otra llamada analiza **solo tu último mensaje** y responde en 1 o 2 frases breves: si es correcto, algo como "✓ Correct and natural."; si no, indica el error y la corrección.

La conversación envía al modelo **todo el historial** del chat. El feedback se calcula únicamente sobre cada mensaje aislado, sin contexto previo.

### 7.2 Requisitos

- Ollama en marcha en `http://localhost:11434` y el modelo descargado.
- Si no hay conexión, aparece el aviso: *"No se pudo conectar con Ollama en localhost:11434. Asegúrate de tener Ollama instalado y corriendo (`ollama serve`), y de haber descargado el modelo (`ollama pull llama3.2`)."*

### 7.3 Controles

| Control | Función |
|---|---|
| **Modelo Ollama** (campo) | Nombre del modelo a usar. Por defecto `llama3.2`. Se **recuerda** entre sesiones (`localStorage`) |
| **🔊 Voz ON / 🔇 Voz OFF** | Activa o desactiva la lectura automática de las respuestas. Activada por defecto. Al alternarlo se interrumpe cualquier lectura |
| **🎤** (junto al campo de texto) | Dictado por voz en inglés |
| Campo de texto + [Enviar] | Entrada escrita. **Enter** envía |
| **🔊** en cada burbuja del asistente | Relee esa respuesta |
| **Panel 📝 Feedback** | Lista de comentarios sobre tus mensajes |
| **Botón flotante 📝** | Abre el feedback como panel lateral emergente en pantallas estrechas |

### 7.4 Procedimiento: conversación escrita

1. Abre **Conversar**.
2. Comprueba el nombre del modelo en **Modelo Ollama**.
3. Escribe un mensaje en inglés y pulsa **Enter** o [Enviar].
4. Mientras el modelo piensa se muestra una burbuja con "···" y el campo queda desactivado.
5. Lee la respuesta (y escúchala si "Voz" está activada).
6. Revisa el comentario de tu mensaje en el panel de feedback.

### 7.5 Procedimiento: conversación hablada

1. Pulsa 🎤 y concede el permiso de micrófono.
2. Habla en inglés. Aparece "🎙️ Escuchando…".
3. Al terminar de hablar, el texto reconocido se **envía automáticamente** como mensaje.
4. Para cancelar, pulsa de nuevo el micrófono mientras escucha.

Al empezar a escuchar se interrumpe cualquier lectura en curso. El micrófono se desactiva mientras el modelo responde.

### 7.6 Panel de feedback

- Cada entrada muestra tu frase entre comillas y el comentario del modelo.
- Mientras se calcula aparece "Analizando…".
- Las entradas cuyo comentario empieza por **✓** se muestran como positivas y el resto como observaciones.
- Si la llamada de feedback falla, la entrada se elimina sin mostrar error.
- Con pantallas estrechas el panel pasa a un cajón accesible desde el botón flotante 📝.

### 7.7 Integración con el estudio

Al entrar en **Conversar**, la app consulta las **12 palabras más recientemente marcadas** (Dominada o Repasar) y se las pasa al modelo. El sistema ordena por fecha de marcado, de más reciente a menos, y desempata dando prioridad a las tarjetas en estado *Repasar*. Un aviso bajo el título muestra las **6 primeras** ("El modelo intentará usar palabras que estás repasando: …").

Para aprovecharlo: estudia primero, marca las tarjetas y entonces abre el chat. La lista se refresca cada vez que entras en la vista.

### 7.8 Persistencia y limitaciones del chat

- 🔎 **La conversación y el feedback no se guardan.** Al cambiar a otra vista se desmonta el chat y se pierden. Copia lo que quieras conservar antes de salir.
- El modelo elegido sí se recuerda.
- El modelo puede ignorar las palabras sugeridas, porque el prompt le pide no forzarlas.
- La calidad de las correcciones depende del modelo. Los modelos pequeños pueden dar falsos positivos o negativos.
- No hay respuesta en streaming: aparece completa al terminar.

---

## 8. Servicios transversales

### 8.1 Voz

| Función | API | Idioma | Notas |
|---|---|---|---|
| Síntesis | `speechSynthesis` | `en-US` | Cancela la lectura previa al iniciar otra |
| Reconocimiento | `SpeechRecognition` / `webkitSpeechRecognition` | `en-US` | Una sola frase por activación, sin resultados parciales |

### 8.2 Almacenamiento

| Dato | Dónde | Duración |
|---|---|---|
| Tarjetas, ejemplos, progreso, Insistir | IndexedDB (`flashcards_sqlite`) | Hasta que borres los datos del sitio |
| Modelo de Ollama elegido | `localStorage` | Igual |
| Conversación y feedback | Memoria de la página | Solo mientras estás en la vista Conversar |
| Filtro, aleatorio, modo Insistir | Memoria de la página | Se reinician al recargar |

### 8.3 Evolución del esquema

Al cargar una base existente se ejecuta una migración idempotente que añade columnas nuevas. Una actualización de la app no destruye tus datos.

---

## 9. Protocolo de estudio sugerido

> Esta sección es una **propuesta metodológica**, no una funcionalidad de la app ni un resultado medido. FlashCine **no implementa un algoritmo de repetición espaciada**: el orden y la frecuencia de repaso dependen de ti.

### 9.1 Fundamento

La literatura sobre aprendizaje apoya dos prácticas que la app facilita: la **recuperación activa** (intentar recordar antes de ver la respuesta; Roediger y Karpicke, 2006) y la **práctica distribuida** (repartir los repasos en el tiempo; Cepeda et al., 2006). El protocolo las traduce a acciones concretas dentro de la app.

### 9.2 Rutina diaria (≈15–20 min)

| Fase | Minutos | Acción en la app |
|---|---|---|
| 1. Calentamiento | 5 | **Estudiar** con una categoría y modo aleatorio. Recuerda antes de voltear. Marca Dominada o Repasar |
| 2. Refuerzo | 5 | Activa **Insistir** y repasa las tarjetas marcadas. Desmarca las que ya domines |
| 3. Producción | 5 | Usa [🎤 Practicar] en 5–10 tarjetas y repite las que fallen |
| 4. Contexto | 5–10 | **Conversar** sobre cualquier tema. Revisa el feedback al final |

### 9.3 Rutina semanal

- Una vez por semana, exporta con [📤 Exportar vocabulario a JSON] y [🗄️ Exportar base de datos].
- Revisa las tarjetas marcadas como *Repasar* durante más de una semana. Reescribe sus ejemplos (✏️) con frases propias para fijarlas.
- Añade vocabulario nuevo en lotes (importación) o sobre la marcha (+ Añadir).

### 9.4 Buenas prácticas al crear tarjetas

1. **Una idea por tarjeta.** Evita meter varios significados distintos en una.
2. **Ejemplos propios y breves**, con la palabra en una frase que podrías decir tú.
3. **Phrasal verbs completos** ("figure out", no solo "figure").
4. **Categorías con criterio estable** (tema, serie o tipo de palabra), para que el filtro sea útil.

---

## 10. Personalización y extensión (nivel avanzado)

### 10.1 Cambiar el modelo por defecto o la URL de Ollama

Edita las constantes `DEFAULT_MODEL` y `OLLAMA_URL` en `flashcards-app/src/ollama.js`.

### 10.2 Añadir una categoría con color propio

En `flashcards-app/src/constants/categories.js`, añade una entrada a `CATEGORY_COLORS`:

```js
export const CATEGORY_COLORS = {
  // …
  "Mi categoría": "#FFB703",
};
```

No hay que tocar ningún otro archivo. Si la categoría ya existe en tus tarjetas, tomará el color al recargar.

### 10.3 Más información técnica

La arquitectura, el flujo de datos y los pasos para añadir una vista o un campo nuevo a las tarjetas están en `CLAUDE.md`.

---

## 11. Catálogo de problemas de uso

| Síntoma | Causa probable | Solución |
|---|---|---|
| No aparecen mis tarjetas ni mi progreso | Otro navegador, otro puerto o datos del sitio borrados | Volver al navegador y puerto originales; si hay copia, importar el JSON (solo recupera vocabulario) |
| [🎤 Practicar] marca "no coincide" con buena pronunciación | La tarjeta contiene signos, barras o varias formas; el reconocedor devuelve otra transcripción | Repetir más despacio o simplificar el texto de la palabra con ✏️ |
| El micrófono no responde | Permiso denegado o navegador sin soporte | Permitir el micrófono en el candado de la barra y usar Chrome o Edge |
| No se oye la voz | Volumen, sin voces en inglés instaladas o "Voz OFF" en el chat | Revisar el sistema, instalar voces en inglés y comprobar el botón de voz |
| El chat muestra el error de conexión | Ollama apagado o modelo no descargado | `ollama serve` y `ollama pull <modelo>`; revisar el campo "Modelo Ollama" |
| El chat tarda mucho | Modelo grande para tu equipo | Probar `llama3.2:1b` |
| El modo Insistir muestra el mensaje de vacío | Ninguna tarjeta marcada (o ninguna en la categoría filtrada) | Marcar tarjetas o cambiar el filtro |
| Tras importar faltan palabras | Elementos sin `word` válido ignorados, o JSON que no es un array | Revisar el formato (§5.4) |
| Un significado importado aparece duplicado con " / " | La palabra ya existía con un significado distinto | Editar la tarjeta (✏️) y dejar el texto deseado |
| Desaparece una conversación | Se cambió de vista | Copiar el texto antes de salir (§7.8) |

---

## 12. Discusión

### 12.1 Fortalezas

- **Integración de habilidades** en una sola herramienta: leer, escuchar, hablar y escribir.
- **Privacidad:** el vocabulario y el chat con el modelo no salen del equipo. La excepción es el reconocimiento de voz del navegador, que puede usar servicios externos (§4.10).
- **Ligereza:** no hay cuentas, servidor ni suscripciones.
- **Retroalimentación inmediata** tanto en pronunciación como en gramática.

### 12.2 Limitaciones

| Limitación | Efecto | Origen |
|---|---|---|
| Sin repetición espaciada automática | El usuario decide qué repasar y cuándo | Diseño |
| Backup del progreso solo en `.sqlite`, sin importación en la interfaz | Restaurar el progreso requiere herramientas externas | Diseño actual |
| Borrado sin confirmación | Riesgo de pérdida accidental | Implementación |
| Comparación exacta en la práctica de pronunciación | Falsos "no coincide" | Implementación |
| Chat sin persistencia | Se pierde al cambiar de vista | Implementación |
| Creación de categorías nuevas desde el formulario posiblemente defectuosa 🔎 | Categoría de un solo carácter | Implementación |
| Reordenado del mazo aleatorio al marcar Insistir 🔎 | Orden cambiante | Implementación |
| Calidad variable del feedback | Depende del modelo | Modelo local |

### 12.3 Trabajo futuro (propuestas)

Importación de la base `.sqlite`, confirmación de borrado, comparación tolerante en la práctica de pronunciación, historial de conversaciones guardado, repetición espaciada y estadísticas por sesión.

### 12.4 Validez de este documento

Describe el comportamiento según el código del repositorio en el momento de redactarlo. No se han medido tiempos ni se ha evaluado la eficacia pedagógica de la app. Los puntos marcados con 🔎 deben comprobarse en ejecución antes de darlos por confirmados.

---

## 13. Conclusiones

FlashCine ofrece un ciclo completo de estudio de vocabulario: recuperación activa en las tarjetas, autoevaluación con tres señales independientes, práctica oral y uso en contexto con un modelo local. Su principal punto fuerte es la simplicidad y la privacidad. Sus puntos débiles principales son la falta de repetición espaciada y las copias de seguridad de progreso poco convenientes. Con el protocolo de la §9 y las advertencias de la §12, se puede sacar partido a las funciones actuales.

---

## Referencias

1. Repositorio del proyecto: https://github.com/RickDecar/flascards-ingles-app
2. Guía de instalación: `guiaInstalacionDetallada.md`; arquitectura: `CLAUDE.md`.
3. Roediger, H. L., y Karpicke, J. D. (2006). *Test-enhanced learning: Taking memory tests improves long-term retention.* Psychological Science, 17(3), 249–255.
4. Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., y Rohrer, D. (2006). *Distributed practice in verbal recall tasks: A review and quantitative synthesis.* Psychological Bulletin, 132(3), 354–380.
5. MDN, Web Speech API: https://developer.mozilla.org/docs/Web/API/Web_Speech_API
6. MDN, IndexedDB API: https://developer.mozilla.org/docs/Web/API/IndexedDB_API
7. Ollama: https://ollama.com
8. sql.js: https://github.com/sql-js/sql.js

---

## Apéndice A. Referencia rápida de controles

| Vista | Control | Efecto |
|---|---|---|
| Cabecera | Estudiar / Vocabulario / Conversar / + Añadir | Cambia de vista |
| Estudiar | Pulsar la tarjeta | Voltea |
| Estudiar | ✓ Dominada / ↻ Repasar | Guarda estado y avanza |
| Estudiar | ← / → | Navega sin cambiar estado |
| Estudiar | Casilla Insistir | Marca la tarjeta para el modo Insistir |
| Estudiar | 🔀 Aleatorio | Baraja el mazo |
| Estudiar | ⚠️ Revisar … insistir | Mazo solo con tarjetas marcadas |
| Estudiar | ↺ Reiniciar | Reconstruye el mazo desde la posición 1 |
| Estudiar | 🔊 / 🎤 | Escuchar / practicar pronunciación |
| Vocabulario | 📥 Importar JSON | Fusiona vocabulario desde un archivo |
| Vocabulario | 🗄️ Exportar base de datos | Descarga `flashcards.sqlite` |
| Vocabulario | 📤 Exportar vocabulario a JSON | Descarga `vocabulario.json` |
| Vocabulario | ✏️ / 🗑 | Editar / borrar (sin confirmación) |
| Conversar | Enter | Envía el mensaje |
| Conversar | 🎤 | Dictado y envío automático |
| Conversar | 🔊 Voz ON/OFF | Lectura automática de respuestas |
| Conversar | 📝 | Abre el feedback en pantallas estrechas |

## Apéndice B. Formato de intercambio (JSON)

```json
[
  {
    "word": "string (obligatorio)",
    "meaning": "string",
    "category": "string",
    "examples": ["string", "string"]
  }
]
```

## Apéndice C. Esquema de la base de datos

| Tabla | Columnas principales |
|---|---|
| `cards` | `id`, `type`, `word`, `meaning`, `category`, `incidir`, `created_at` |
| `examples` | `id`, `card_id` (→ `cards`, borrado en cascada), `example_text`, `position` |
| `progress` | `card_id` (→ `cards`, borrado en cascada), `status` (`known` o `learning`), `updated_at` |
