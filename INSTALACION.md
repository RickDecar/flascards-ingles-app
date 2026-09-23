# 🚀 Guía de instalación — FlashCine

Esta guía explica paso a paso cómo pasar de **cero** a tener FlashCine funcionando en tu equipo, incluida la vista **💬 Conversar**, que usa un modelo de IA local con [Ollama](https://ollama.com).

> **Resumen rápido** (si ya tienes Git, Node.js y Ollama):
>
> ```bash
> git clone https://github.com/RickDecar/flascards-ingles-app.git
> cd flascards-ingles-app
> ollama pull llama3.2
> cd flashcards-app
> npm install
> npm start
> ```
>
> Abre http://localhost:3000 y listo.

---

## 📋 Índice

1. [Qué vas a instalar y por qué](#1-qué-vas-a-instalar-y-por-qué)
2. [Requisitos previos](#2-requisitos-previos)
3. [Instalar Git](#3-instalar-git)
4. [Instalar Node.js](#4-instalar-nodejs)
5. [Instalar Ollama y descargar el modelo](#5-instalar-ollama-y-descargar-el-modelo)
6. [Clonar el repositorio](#6-clonar-el-repositorio)
7. [Instalar dependencias y arrancar la app](#7-instalar-dependencias-y-arrancar-la-app)
8. [Arranque rápido en Windows (`start.bat`)](#8-arranque-rápido-en-windows-startbat)
9. [Comprobar que todo funciona](#9-comprobar-que-todo-funciona)
10. [Uso diario](#10-uso-diario)
11. [Solución de problemas](#11-solución-de-problemas)
12. [Estructura del proyecto y siguientes pasos](#12-estructura-del-proyecto-y-siguientes-pasos)

---

## 1. Qué vas a instalar y por qué

| Herramienta | Para qué sirve en este proyecto | ¿Obligatoria? |
|-------------|---------------------------------|---------------|
| **Git** | Descargar (clonar) el código y guardar tus cambios | Sí |
| **Node.js + npm** | Ejecutar el servidor de desarrollo de React e instalar librerías | Sí |
| **Ollama** | Ejecutar un modelo de lenguaje *en tu propio equipo* para la vista **Conversar** | Solo para *Conversar* |
| **Navegador Chrome / Edge** | Usar la app; son los que mejor soportan la síntesis y el reconocimiento de voz (🔊 / 🎤) | Recomendado |

💡 **Cómo encaja todo:** FlashCine es una aplicación web que se ejecuta entera en tu navegador. Las tarjetas se guardan en una base de datos SQLite dentro del propio navegador (IndexedDB), así que **no hay servidor ni base de datos que instalar**. Lo único "externo" es Ollama, que expone una API en `http://localhost:11434` a la que la app envía los mensajes del chat.

```
Navegador (http://localhost:3000)
 ├── React (FlashCine)
 ├── SQLite (sql.js) ──► IndexedDB   ← tus tarjetas y progreso
 └── Vista Conversar ──► Ollama (http://localhost:11434) ──► modelo llama3.2
```

---

## 2. Requisitos previos

- **Sistema operativo:** Windows 10/11, macOS 12+ o Linux.
- **Espacio en disco:** ~500 MB para `node_modules` + **~2 GB** para el modelo `llama3.2`.
- **Memoria RAM:** 8 GB recomendados para ejecutar el modelo con fluidez.
- **Conexión a internet:** solo para la instalación (después Ollama funciona sin conexión).

---

## 3. Instalar Git

<details>
<summary><b>Windows</b></summary>

1. Descarga el instalador desde https://git-scm.com/download/win
2. Ejecútalo dejando las opciones por defecto.
3. O bien, desde PowerShell: `winget install --id Git.Git -e`
</details>

<details>
<summary><b>macOS</b></summary>

```bash
xcode-select --install     # instala Git con las herramientas de línea de comandos
# o, con Homebrew:
brew install git
```
</details>

<details>
<summary><b>Linux (Debian/Ubuntu)</b></summary>

```bash
sudo apt update && sudo apt install -y git
```
</details>

Comprueba la instalación:

```bash
git --version
```

---

## 4. Instalar Node.js

El proyecto usa **Create React App (react-scripts 5)**. Recomendamos la versión **LTS** de Node.js (20 o 22).

<details>
<summary><b>Windows</b></summary>

- Descarga el instalador **LTS** desde https://nodejs.org y ejecútalo con las opciones por defecto.
- O desde PowerShell: `winget install OpenJS.NodeJS.LTS`
</details>

<details>
<summary><b>macOS</b></summary>

```bash
brew install node@22
```
</details>

<details>
<summary><b>Linux</b> (recomendado: nvm)</summary>

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# cierra y vuelve a abrir la terminal
nvm install --lts
```
</details>

Comprueba la instalación (cierra y abre de nuevo la terminal si acabas de instalar):

```bash
node -v   # v20.x o v22.x
npm -v
```

---

## 5. Instalar Ollama y descargar el modelo

Ollama es un programa que descarga y ejecuta modelos de lenguaje (LLM) en local. La app lo usa para dos cosas en cada mensaje del chat:

1. **Conversar** contigo en inglés, intentando usar las palabras que estás repasando.
2. **Corregir** tu mensaje (feedback gramatical breve).

### 5.1 Instalar Ollama

<details>
<summary><b>Windows</b></summary>

1. Descarga `OllamaSetup.exe` desde https://ollama.com/download/windows
2. Ejecútalo. Ollama queda instalado y se arranca en segundo plano (icono de la llama 🦙 junto al reloj).
</details>

<details>
<summary><b>macOS</b></summary>

1. Descarga la app desde https://ollama.com/download/mac, descomprímela y muévela a *Aplicaciones*.
2. Ábrela una vez; aparecerá el icono 🦙 en la barra de menú.

O con Homebrew: `brew install ollama`
</details>

<details>
<summary><b>Linux</b></summary>

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

El instalador crea un servicio de systemd que arranca Ollama automáticamente.
</details>

Comprueba la instalación:

```bash
ollama --version
```

### 5.2 Descargar el modelo

La app usa por defecto el modelo **`llama3.2`** (~2 GB):

```bash
ollama pull llama3.2
```

Pruébalo directamente en la terminal (escribe `/bye` para salir):

```bash
ollama run llama3.2 "Say hello in one short sentence"
```

### 5.3 Asegurarte de que Ollama está en marcha

La app necesita que Ollama esté escuchando en `http://localhost:11434`:

```bash
curl http://localhost:11434
# Respuesta esperada: Ollama is running
```

Si no responde, arráncalo manualmente y **deja esa terminal abierta**:

```bash
ollama serve
```

> ℹ️ Si aparece `Error: listen tcp 127.0.0.1:11434: bind: address already in use`, significa que **ya estaba en marcha**. No es un problema.

### 5.4 (Opcional) Usar otro modelo

Puedes usar cualquier modelo de https://ollama.com/library. Por ejemplo:

| Modelo | Tamaño aprox. | Cuándo usarlo |
|--------|---------------|---------------|
| `llama3.2:1b` | ~1,3 GB | Equipos con poca RAM; respuestas más rápidas, algo menos precisas |
| `llama3.2` | ~2 GB | **Por defecto.** Buen equilibrio |
| `qwen2.5:7b` / `llama3.1:8b` | ~4,7 GB | Mejor calidad de corrección gramatical si tienes 16 GB de RAM |

```bash
ollama pull llama3.2:1b
```

Después, en la vista **💬 Conversar**, escribe el nombre del modelo en el campo **"Modelo Ollama"**. La app lo recuerda (se guarda en `localStorage`).

---

## 6. Clonar el repositorio

Elige la carpeta donde quieres el proyecto y ejecuta:

```bash
git clone https://github.com/RickDecar/flascards-ingles-app.git
cd flascards-ingles-app
```

---

## 7. Instalar dependencias y arrancar la app

Todo el código de la aplicación está en la subcarpeta **`flashcards-app/`**:

```bash
cd flashcards-app
npm install     # solo la primera vez (o cuando cambie package.json)
npm start       # arranca el servidor de desarrollo
```

Se abrirá automáticamente el navegador en **http://localhost:3000**. Si no, ábrelo a mano.

Para detener el servidor: `Ctrl + C` en la terminal.

### Comandos disponibles

| Comando (desde `flashcards-app/`) | Qué hace |
|-----------------------------------|----------|
| `npm install` | Instala las dependencias (React, sql.js…) |
| `npm start` | Servidor de desarrollo con recarga automática en `http://localhost:3000` |
| `npm run build` | Genera la versión de producción optimizada en `flashcards-app/build/` |

> El proyecto no tiene tests configurados.

---

## 8. Arranque rápido en Windows (`start.bat`)

En la raíz del repositorio hay dos scripts para no tener que escribir comandos:

| Script | Qué hace |
|--------|----------|
| **`start.bat`** | Comprueba si Ollama está en marcha; si no, lo arranca (minimizado), espera a que responda y después ejecuta `npm start`. **Recomendado.** |
| `flashcards.bat` | Solo arranca la app (`npm start`), sin Ollama. |

Uso: haz **doble clic** en `start.bat` (la primera vez, ejecuta antes `npm install` dentro de `flashcards-app/`).

💡 Truco: crea un acceso directo a `start.bat` en el escritorio para abrir FlashCine con un clic.

---

## 9. Comprobar que todo funciona

Lista de verificación:

- [ ] `git --version`, `node -v` y `ollama --version` muestran una versión.
- [ ] `curl http://localhost:11434` devuelve `Ollama is running`.
- [ ] `ollama list` muestra `llama3.2` (o el modelo que elegiste).
- [ ] http://localhost:3000 muestra la vista **Estudiar** con las 122 tarjetas iniciales.
- [ ] En **💬 Conversar**, al escribir *"Hi! How are you?"* recibes una respuesta y un feedback de tu mensaje.
- [ ] El botón 🔊 lee la palabra en voz alta y 🎤 pide permiso para el micrófono (Chrome/Edge).

---

## 10. Uso diario

Una vez instalado, cada vez que quieras usar la app:

```bash
# 1) Asegúrate de que Ollama está corriendo (en Windows/macOS suele arrancar solo)
curl http://localhost:11434 || ollama serve

# 2) Arranca la app
cd flascards-ingles-app/flashcards-app
npm start
```

En Windows basta con doble clic en **`start.bat`**.

Para traer los últimos cambios del repositorio:

```bash
git pull
cd flashcards-app && npm install   # por si hay dependencias nuevas
```

### Dónde se guardan tus datos

Tus tarjetas y progreso viven en **IndexedDB del navegador** (base de datos `flashcards_sqlite`), ligados a `http://localhost:3000`. Esto implica:

- Si usas **otro navegador u otro puerto**, verás las 122 tarjetas iniciales, no las tuyas.
- Si **borras los datos del sitio** en el navegador, pierdes tus tarjetas.
- 👉 Haz copias de seguridad desde **Vocabulario → 📤 Exportar JSON**, y restáuralas con **📥 Importar JSON**.

---

## 11. Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| *"No se pudo conectar con Ollama en localhost:11434…"* en **Conversar** | Ollama no está en marcha | Ejecuta `ollama serve` (o abre la app de Ollama) y comprueba con `curl http://localhost:11434` |
| El chat da error aunque Ollama responde | El modelo no está descargado o el nombre está mal escrito | `ollama list` para ver los modelos; `ollama pull llama3.2`; revisa el campo **"Modelo Ollama"** |
| Error de **CORS** en la consola del navegador (F12) | Abres la app desde un origen distinto de `localhost` (p. ej. la IP de tu red) | Usa `http://localhost:3000`, o define la variable de entorno `OLLAMA_ORIGINS=*` y reinicia Ollama |
| Respuestas muy lentas | Modelo demasiado grande para tu equipo | Prueba `llama3.2:1b` y cierra otras aplicaciones pesadas |
| `'npm' no se reconoce como un comando…` | Node.js no está en el PATH | Cierra y abre la terminal; si persiste, reinstala Node.js |
| `Something is already running on port 3000` | Otra instancia de la app (u otro programa) usa el puerto | Pulsa `Y` para usar otro puerto (tus datos no aparecerán, ver [§10](#dónde-se-guardan-tus-datos)) o cierra el otro proceso |
| Errores raros tras `npm install` | Instalación corrupta o versión de Node inadecuada | Usa Node LTS y reinstala: borra la carpeta `node_modules` (no `package-lock.json`) y ejecuta `npm install` |
| 🎤 no hace nada | Navegador sin soporte o permiso de micrófono denegado | Usa Chrome/Edge y permite el micrófono en el candado de la barra de direcciones |
| La app muestra solo las tarjetas iniciales | Cambiaste de navegador/puerto o se borraron los datos del sitio | Importa tu última copia desde **📥 Importar JSON** |
| `ollama serve` → `address already in use` | Ollama ya estaba en marcha | No hagas nada, ya funciona |

---

## 12. Estructura del proyecto y siguientes pasos

```
flascards-ingles-app/
├── INSTALACION.md            ← esta guía
├── README.md                 ← descripción general y funcionalidades
├── CLAUDE.md                 ← arquitectura detallada (SOLID, flujo de datos, convenciones)
├── start.bat                 ← arranque Ollama + app (Windows)
├── flashcards.bat            ← arranque solo app (Windows)
├── *.json                    ← vocabulario de ejemplo para importar
└── flashcards-app/           ← la aplicación React
    ├── package.json
    ├── public/               ← index.html y los binarios sql-wasm*.wasm
    └── src/
        ├── App.js            ← orquestador de vistas
        ├── ChatView.js       ← vista Conversar
        ├── ollama.js         ← cliente HTTP de Ollama (URL y modelo por defecto)
        ├── db.js             ← capa SQLite (sql.js + IndexedDB)
        ├── data.js           ← 122 tarjetas iniciales
        ├── hooks/            ← useCards, useDeck, usePronunciation
        ├── views/            ← StudyView, ListView, AddView
        ├── services/         ← speech.js (Web Speech API)
        └── constants/        ← categorías y colores
```

**Para empezar a desarrollar:**

1. Lee [`CLAUDE.md`](CLAUDE.md): explica la arquitectura, cómo añadir una categoría, una vista o un campo nuevo a las tarjetas.
2. Crea una rama para tu cambio: `git checkout -b mi-cambio`.
3. Con `npm start` activo, cada vez que guardes un archivo el navegador se recargará automáticamente.
4. Para cambiar la URL o el modelo por defecto de Ollama, edita las constantes `OLLAMA_URL` y `DEFAULT_MODEL` en `flashcards-app/src/ollama.js`.

¡A aprender inglés! 🎬🇬🇧
