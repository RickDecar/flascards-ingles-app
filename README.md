# FlashCine — Aprende inglés con el vocabulario de tus películas y series

App de flashcards para aprender inglés de forma activa. Incluye 122 tarjetas preinstaladas con vocabulario real de películas, series y conversaciones cotidianas, con soporte para crear tu propio vocabulario personalizado.

## Demo rápida

| Estudiar | Lista | Añadir |
|----------|-------|--------|
| Voltea la tarjeta para ver el significado | Gestiona todo tu vocabulario en una tabla | Añade palabras con significado y hasta 5 ejemplos |

## Características

- **Modo Estudio** — tarjetas con animación de volteo, navegación manual y marcado de progreso
- **Pronunciación** — botón 🔊 *Escuchar* para oír la palabra y cada ejemplo (Web Speech API), y botón 🎤 *Practicar* que reconoce tu voz y compara lo dicho con la palabra objetivo (✅/❌)
- **Progreso por tarjeta** — marca cada palabra como *Dominada* o *Repasar*
- **Filtro por categoría** — Alta frecuencia, Phrasal Verbs, Expresiones, Verbos, Sustantivos, Adjetivos, Grimm...
- **Barajar** — aleatoriza el mazo con un clic
- **Vista Lista** — tabla con todas las tarjetas, estado de progreso, edición y borrado inline
- **Añadir vocabulario** — formulario con palabra, significado, hasta 5 ejemplos y categoría
- **Categorías personalizadas** — crea nuevas categorías directamente desde el formulario
- **Persistencia automática** — todo se guarda en `localStorage`, sin backend ni cuenta

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
- **localStorage** — persistencia de tarjetas y progreso sin backend
- **Create React App** — bundling y entorno de desarrollo

## Estructura del proyecto

```
flascards-ingles-app/
├── flashcards-app/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js      # Componente principal (lógica + UI)
│       ├── App.css     # Estilos (variables CSS, tema oscuro)
│       ├── data.js     # 100 tarjetas preinstaladas
│       └── index.js    # Punto de entrada React
└── README.md
```

## Uso

### Estudiar

1. Selecciona una categoría (o "Todas")
2. Activa *Aleatorio* si quieres barajar
3. Haz clic en la tarjeta para ver el significado
4. Marca ✓ **Dominada** o ↻ **Repasar** para registrar tu progreso

### Añadir vocabulario

1. Ve a la pestaña **Añadir**
2. Escribe la palabra, su significado y ejemplos de uso
3. Selecciona o crea una categoría
4. Guarda — la tarjeta aparece inmediatamente en el mazo

### Editar o borrar

Desde la pestaña **Lista**, cada tarjeta tiene botones de edición y borrado.

### Pronunciación

1. Pulsa 🔊 **Escuchar** para oír la pronunciación de la palabra (o de cualquier ejemplo, en el reverso de la tarjeta)
2. Pulsa 🎤 **Practicar** y di la palabra en voz alta
3. La app compara lo que entendió con la palabra objetivo y muestra ✅ o ❌

> Requiere un navegador basado en Chromium (Chrome/Edge) con permiso de micrófono. En navegadores sin soporte para `SpeechRecognition` (p. ej. Firefox) se muestra un aviso.
