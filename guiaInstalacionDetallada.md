# Despliegue local de FlashCine: guía de instalación reproducible con IA local (Ollama)

**Tipo de documento:** guía técnica (how-to) con estructura de artículo de investigación
**Proyecto:** FlashCine, aplicación web de flashcards para aprender vocabulario en inglés
**Repositorio:** https://github.com/RickDecar/flascards-ingles-app
**Alcance:** instalación desde cero en Windows 10/11, macOS y Linux

---

## Resumen

FlashCine es una aplicación de página única (SPA) en React 18 que ofrece 503 tarjetas de vocabulario y una vista de conversación asistida por un modelo de lenguaje local. Este documento describe de forma reproducible cómo desplegar el sistema completo en un equipo personal. Presenta la arquitectura, justifica cada dependencia, detalla un procedimiento paso a paso con la salida esperada de cada comando, define un protocolo de verificación y recoge un catálogo de fallos con diagnóstico y solución. El despliegue no necesita servidor propio ni base de datos externa. Los datos del usuario se almacenan en el navegador y la inferencia del modelo se ejecuta en la máquina local, sin enviar contenido a terceros.

**Palabras clave:** React, sql.js, IndexedDB, Ollama, LLM local, flashcards, despliegue reproducible.

---

## 1. Introducción

### 1.1 Motivación

Las aplicaciones de repetición espaciada suelen depender de servicios en la nube. FlashCine adopta el enfoque contrario: toda la lógica y los datos viven en el equipo del usuario. Esto elimina cuentas y suscripciones, permite usar la app sin conexión una vez instalada y mantiene el vocabulario y las conversaciones en la máquina.

### 1.2 Objetivos de la guía

1. Que un lector sin conocimientos previos del proyecto llegue a un sistema funcional.
2. Que cada paso tenga un **criterio de éxito observable** (salida esperada).
3. Documentar las **decisiones de diseño** que afectan a la instalación (dónde se guardan los datos, por qué hace falta Ollama, etc.).
4. Anticipar los fallos más comunes.

### 1.3 Cómo leer este documento

| Si quieres… | Ve a… |
|---|---|
| Instalar cuanto antes | §4 (Procedimiento) y §5 (Verificación) |
| Entender qué instalas y por qué | §2 (Arquitectura) y §3 (Materiales) |
| Resolver un error | §7 (Catálogo de fallos) |
| Evaluar limitaciones y alternativas | §6 (Discusión) |

---

## 2. Arquitectura del sistema

### 2.1 Vista general

```
┌───────────────────────── Navegador (http://localhost:3000) ─────────────────────────┐
│  React 18 (FlashCine)                                                                │
│   ├─ Vistas: Estudiar · Vocabulario · Añadir · Conversar                             │
│   ├─ sql.js (SQLite compilado a WebAssembly) ──► IndexedDB ("flashcards_sqlite")     │
│   ├─ Web Speech API (🔊 síntesis, 🎤 reconocimiento)                                  │
│   └─ Cliente HTTP ──────────────────────────────┐                                    │
└─────────────────────────────────────────────────┼────────────────────────────────────┘
                                                  ▼
                              Ollama (http://localhost:11434/api/chat)
                                                  ▼
                                       Modelo local (llama3.2)
```

### 2.2 Componentes y responsabilidades

| Componente | Función | Dónde corre |
|---|---|---|
| Servidor de desarrollo (react-scripts 5) | Sirve la app en el puerto 3000 y recarga al guardar cambios | Proceso de Node.js |
| sql.js | Motor SQLite en WebAssembly (`sql-wasm.wasm` en `public/`) | Navegador |
| IndexedDB | Persistencia binaria de la base de datos, con exportación diferida tras cada cambio | Navegador |
| Ollama | Servidor de inferencia de modelos de lenguaje | Proceso local, puerto 11434 |
| Modelo `llama3.2` | Genera la conversación y el feedback gramatical | Gestionado por Ollama |

### 2.3 Decisiones de diseño relevantes para la instalación

- **No hay backend propio.** Se instala solo el entorno de ejecución de la interfaz (Node.js) y, de forma opcional, Ollama.
- **Los datos están ligados al origen del navegador** (esquema + host + puerto). Cambiar de navegador o de puerto equivale a empezar con una base de datos nueva (ver §6.2).
- **Ollama es opcional.** Sin él funcionan Estudiar, Vocabulario y Añadir. Solo falla la vista Conversar.
- **Cada mensaje del chat genera dos peticiones en paralelo** al modelo: una para la respuesta conversacional y otra para el análisis gramatical del mensaje del usuario.

---

## 3. Materiales

### 3.1 Software

| Herramienta | Versión recomendada | Función | ¿Obligatoria? |
|---|---|---|---|
| Git | Cualquiera reciente | Clonar el repositorio | Sí |
| Node.js + npm | LTS (20 o 22) | Ejecutar y construir la app | Sí |
| Ollama | Última estable | Ejecutar el LLM local | Solo para Conversar |
| Chrome o Edge | Última estable | Mejor soporte de Web Speech API | Recomendado |

### 3.2 Recursos de hardware (orientativos)

| Recurso | Mínimo | Recomendado |
|---|---|---|
| Disco libre | ~3 GB (dependencias + modelo) | 5 GB |
| RAM | 4 GB sin chat | 8 GB con `llama3.2`; 16 GB con modelos de ~7-8B |
| Red | Solo durante la instalación | — |

Las cifras de espacio (≈500 MB de `node_modules`, ≈2 GB del modelo) proceden de la guía existente del proyecto (`INSTALACION.md`). Varían según versión y plataforma.

### 3.3 Conocimientos previos

Saber abrir una terminal (PowerShell, Terminal o Bash) y ejecutar comandos. No se necesita programar.

---

## 4. Procedimiento

> **Convención:** cada paso termina con un bloque **✅ Criterio de éxito**. No avances al siguiente hasta que se cumpla.

### Paso 1. Instalar Git

**Windows (PowerShell)**
```powershell
winget install --id Git.Git -e
```
**macOS**
```bash
xcode-select --install      # o: brew install git
```
**Linux (Debian/Ubuntu)**
```bash
sudo apt update && sudo apt install -y git
```

✅ **Criterio de éxito** (en una terminal nueva):
```bash
git --version        # → git version 2.x.x
```

### Paso 2. Instalar Node.js (LTS)

**Windows**
```powershell
winget install OpenJS.NodeJS.LTS
```
**macOS**
```bash
brew install node@22
```
**Linux (con nvm)**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# cierra y reabre la terminal
nvm install --lts
```

✅ **Criterio de éxito:**
```bash
node -v    # → v20.x o v22.x
npm -v     # → un número de versión
```

> ⚠️ Tras instalar, **cierra y vuelve a abrir la terminal**. El PATH solo se actualiza en sesiones nuevas.

### Paso 3. Instalar Ollama

**Windows:** descarga y ejecuta `OllamaSetup.exe` desde https://ollama.com/download/windows. Queda en segundo plano (icono de la llama).
**macOS:** descarga la app desde https://ollama.com/download/mac y ábrela una vez (o `brew install ollama`).
**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

✅ **Criterio de éxito:**
```bash
ollama --version
```

### Paso 4. Descargar el modelo de lenguaje

La app usa por defecto `llama3.2` (constante `DEFAULT_MODEL` en `flashcards-app/src/ollama.js`).

```bash
ollama pull llama3.2
ollama run llama3.2 "Say hello in one short sentence"    # prueba rápida; /bye para salir
```

✅ **Criterio de éxito:** `ollama list` muestra `llama3.2` y la prueba devuelve una frase en inglés.

### Paso 5. Verificar que el servidor de Ollama responde

```bash
curl http://localhost:11434
```
Salida esperada: `Ollama is running`.

Si no responde, arráncalo y **deja esa terminal abierta**:
```bash
ollama serve
```
Si aparece `address already in use`, Ollama ya estaba corriendo y no hay que hacer nada.

✅ **Criterio de éxito:** `curl` devuelve `Ollama is running`.

### Paso 6. Clonar el repositorio

```bash
git clone https://github.com/RickDecar/flascards-ingles-app.git
cd flascards-ingles-app
```

✅ **Criterio de éxito:** existen las carpetas `flashcards-app/` y los archivos `README.md`, `CLAUDE.md` y `INSTALACION.md`.

### Paso 7. Instalar las dependencias de la aplicación

El código vive en la subcarpeta `flashcards-app/`. **Todos los comandos de npm se ejecutan desde ahí.**

```bash
cd flashcards-app
npm install
```

Dependencias directas declaradas en `package.json`: `react` ^18.2.0, `react-dom` ^18.2.0, `react-scripts` 5.0.1 y `sql.js` ^1.14.1.

✅ **Criterio de éxito:** el comando termina sin errores (los avisos `npm warn` son normales) y aparece la carpeta `node_modules/`.

### Paso 8. Arrancar la aplicación

```bash
npm start
```

Se abre el navegador en **http://localhost:3000**. Para detener el servidor, pulsa `Ctrl + C`.

✅ **Criterio de éxito:** la vista **Estudiar** muestra tarjetas. En la primera carga, la base de datos se siembra con las 503 tarjetas iniciales.

### Paso 9 (solo Windows, opcional). Arranque con un clic

En la raíz del repositorio:

| Script | Comportamiento |
|---|---|
| `start.bat` | Comprueba si Ollama responde. Si no, lo lanza minimizado (`ollama serve`) y espera hasta ~20 s. Después ejecuta `npm start`. Si Ollama no está instalado, muestra un error y se detiene. |
| `flashcards.bat` | Ejecuta solo `npm start`. |

Haz doble clic en `start.bat`. Antes, ejecuta `npm install` una vez (Paso 7).

### Paso 10 (opcional). Compilación de producción

```bash
npm run build      # genera flashcards-app/build/
```

El proyecto no incluye un script de tests (`No test suite is configured`).

---

## 5. Verificación y resultados esperados

### 5.1 Lista de comprobación

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | `git --version`, `node -v`, `ollama --version` | Los tres muestran versión |
| 2 | `curl http://localhost:11434` | `Ollama is running` |
| 3 | `ollama list` | Incluye `llama3.2` (o el modelo elegido) |
| 4 | Abrir `http://localhost:3000` | Vista Estudiar con tarjetas |
| 5 | Voltear una tarjeta y marcar *Dominada* o *Repasar* | El estado cambia y persiste tras recargar (F5) |
| 6 | Vista **Conversar**: enviar "Hi! How are you?" | Llega una respuesta corta y un feedback gramatical |
| 7 | Pulsar 🔊 en una tarjeta | Se lee la palabra en voz alta |
| 8 | Pulsar 🎤 (Chrome/Edge) | El navegador pide permiso de micrófono |

### 5.2 Prueba de persistencia

1. Marca una tarjeta con **Insistir en esta tarjeta**.
2. Recarga la página (F5).
3. Confirma que sigue marcada.

Si la marca se pierde, revisa si el navegador está en modo privado o bloquea datos del sitio (§7).

### 5.3 Prueba de copia de seguridad

1. Ve a **Vocabulario → 📤 Exportar JSON** y guarda el archivo.
2. Comprueba que el archivo no está vacío y que es JSON válido.
3. Para restaurar, usa **📥 Importar JSON**.

---

## 6. Discusión

### 6.1 Ventajas del enfoque local

- **Privacidad:** el texto de las conversaciones no sale del equipo.
- **Coste cero recurrente:** no hay claves de API ni suscripciones.
- **Funcionamiento sin conexión** tras la instalación.
- **Despliegue simple:** un único proceso de Node más, opcionalmente, Ollama.

### 6.2 Limitaciones y riesgos

| Limitación | Consecuencia | Mitigación |
|---|---|---|
| Los datos residen en IndexedDB, por origen | Cambiar de navegador, puerto o limpiar datos del sitio hace perder las tarjetas del usuario | Exportar JSON con regularidad (§5.3) |
| El servidor de desarrollo no es un despliegue de producción | No se debe exponer a internet | Usar solo en `localhost`, o servir `build/` con un servidor estático |
| La calidad del feedback depende del modelo | Modelos pequeños pueden corregir mal o con poca precisión | Probar un modelo mayor si hay RAM (ver §6.3) |
| Latencia de inferencia en CPU | Respuestas lentas en equipos modestos | Usar un modelo más pequeño |
| Web Speech API desigual entre navegadores | 🎤 puede no funcionar fuera de Chrome/Edge | Usar Chrome o Edge |

### 6.3 Elección del modelo (trade-offs)

| Modelo | Tamaño aprox. | Perfil de uso |
|---|---|---|
| `llama3.2:1b` | ~1,3 GB | Equipos con poca RAM; más rápido, menos preciso |
| `llama3.2` | ~2 GB | Valor por defecto; equilibrio |
| `qwen2.5:7b` / `llama3.1:8b` | ~4,7 GB | Mejor corrección gramatical; conviene tener 16 GB de RAM |

Para cambiar de modelo: `ollama pull <modelo>` y escribe el nombre en el campo **"Modelo Ollama"** de la vista Conversar. La app lo guarda en `localStorage`. Para cambiar el valor por defecto, edita `DEFAULT_MODEL` en `flashcards-app/src/ollama.js`.

### 6.4 Validez y alcance

Los criterios de éxito de este documento se basan en la configuración declarada en el repositorio (`package.json`, `ollama.js`, `start.bat`) y en la guía previa `INSTALACION.md`. No incluye mediciones de rendimiento propias. Los tamaños y requisitos de RAM son orientativos y dependen de la versión de cada herramienta.

---

## 7. Catálogo de fallos

| Síntoma | Causa probable | Diagnóstico | Solución |
|---|---|---|---|
| `'npm' no se reconoce como un comando` | Node.js fuera del PATH o terminal antigua | `node -v` falla | Cerrar y abrir la terminal; si persiste, reinstalar Node LTS |
| `npm start` falla con `ENOENT … package.json` | Comando ejecutado en la carpeta equivocada | `pwd` no termina en `flashcards-app` | `cd flashcards-app` |
| Errores raros tras `npm install` | Instalación corrupta o Node no LTS | Revisar `node -v` | Borrar `node_modules` (no `package-lock.json`) y repetir `npm install` con Node LTS |
| `Something is already running on port 3000` | Otra instancia usa el puerto | — | Cerrar el otro proceso. Si aceptas otro puerto, la app arrancará con una base de datos vacía (otro origen) |
| Conversar: "No se pudo conectar con Ollama…" | Ollama apagado | `curl http://localhost:11434` falla | `ollama serve` |
| Conversar falla aunque Ollama responde | Modelo no descargado o nombre incorrecto | `ollama list` | `ollama pull llama3.2` y revisar el campo "Modelo Ollama" |
| Error CORS en la consola (F12) | La app se abre desde una IP de red y no desde `localhost` | Observar el origen en la barra de direcciones | Usar `http://localhost:3000`, o definir `OLLAMA_ORIGINS=*` y reiniciar Ollama |
| Respuestas muy lentas | Modelo grande para el hardware | Monitor de recursos | `llama3.2:1b` y cerrar aplicaciones pesadas |
| 🎤 no responde | Navegador sin soporte o permiso denegado | Candado de la barra de direcciones | Usar Chrome/Edge y permitir el micrófono |
| Solo aparecen las tarjetas iniciales | Otro navegador/puerto, o datos del sitio borrados | Comprobar origen | Importar la última copia JSON |
| `start.bat` dice "Ollama no esta instalado" | `ollama` no está en el PATH | `where ollama` | Instalar Ollama o reabrir la terminal |

---

## 8. Mantenimiento

**Actualizar el proyecto**
```bash
git pull
cd flashcards-app && npm install
```

**Actualizar modelos:** `ollama pull llama3.2` descarga la versión más reciente de la etiqueta.

**Cambiar la URL de Ollama:** editar `OLLAMA_URL` en `flashcards-app/src/ollama.js` (por defecto `http://localhost:11434/api/chat`).

**Ampliar el vocabulario:** el repositorio incluye varios `*.json` de vocabulario (`vocabulario_maestro_merged.json`, `bloque1…3`, etc.) que se pueden cargar con **📥 Importar JSON**.

---

## 9. Conclusiones

FlashCine se despliega con tres herramientas estándar (Git, Node.js y, opcionalmente, Ollama) y unos pocos comandos. Que no haya backend reduce la superficie de fallos. Al mismo tiempo, deja al usuario como único responsable de sus copias de seguridad, porque los datos dependen del origen del navegador. El protocolo de la §5 permite comprobar de forma objetiva que la instalación funciona de principio a fin.

---

## Referencias

1. Repositorio del proyecto: https://github.com/RickDecar/flascards-ingles-app
2. Guía previa del proyecto: `INSTALACION.md`; arquitectura: `CLAUDE.md`.
3. Git: https://git-scm.com
4. Node.js: https://nodejs.org
5. Ollama y catálogo de modelos: https://ollama.com y https://ollama.com/library
6. sql.js (SQLite en WebAssembly): https://github.com/sql-js/sql.js
7. Create React App: https://create-react-app.dev
8. MDN, Web Speech API: https://developer.mozilla.org/docs/Web/API/Web_Speech_API
9. MDN, IndexedDB API: https://developer.mozilla.org/docs/Web/API/IndexedDB_API

---

## Apéndice A. Resumen de comandos

```bash
# Instalación única
git clone https://github.com/RickDecar/flascards-ingles-app.git
cd flascards-ingles-app
ollama pull llama3.2
cd flashcards-app
npm install

# Uso diario
curl http://localhost:11434 || ollama serve    # Ollama activo
npm start                                       # app en http://localhost:3000
```

## Apéndice B. Estructura relevante del repositorio

```
flascards-ingles-app/
├── README.md                 descripción y funcionalidades
├── INSTALACION.md            guía de instalación breve
├── guiaInstalacionDetallada.md   este documento
├── CLAUDE.md                 arquitectura y convenciones
├── start.bat / flashcards.bat    arranque en Windows
├── *.json                    vocabulario importable
└── flashcards-app/
    ├── package.json
    ├── public/               index.html y sql-wasm*.wasm
    └── src/                  App.js, db.js, ollama.js, hooks/, views/, services/, constants/
```
