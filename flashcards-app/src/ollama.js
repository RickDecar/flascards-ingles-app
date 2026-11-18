export const OLLAMA_URL = "http://localhost:11434/api/chat";
export const DEFAULT_MODEL = "llama3.2";
export const MODEL_STORAGE_KEY = "english_flashcards_ollama_model";

export const CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con Ollama en localhost:11434. Asegúrate de tener Ollama instalado y corriendo (`ollama serve`), y de haber descargado el modelo (`ollama pull llama3.2`).";

/**
 * Mensaje para cuando Ollama responde pero no tiene el modelo pedido (HTTP 404).
 * @param {string} model nombre del modelo solicitado
 * @returns {string}
 */
export function buildModelNotFoundMessage(model) {
  return `El modelo "${model}" no está descargado en Ollama. Ejecuta \`ollama pull ${model}\` o revisa el nombre en el campo "Modelo Ollama".`;
}

/**
 * Traduce una respuesta HTTP no exitosa de Ollama a un mensaje para el usuario.
 * Solo los fallos de red (sin respuesta) deben usar CONNECTION_ERROR_MESSAGE.
 * @param {number} status código HTTP de la respuesta
 * @param {string} model nombre del modelo solicitado
 * @param {string} [detalle] texto de error devuelto por Ollama, si lo hay
 * @returns {string}
 */
export function buildHttpErrorMessage(status, model, detalle = "") {
  if (status === 404) return buildModelNotFoundMessage(model);
  const sufijo = detalle ? `: ${detalle}` : "";
  if (status >= 500) {
    return `Ollama devolvió un error interno (HTTP ${status})${sufijo}. Revisa la terminal donde corre Ollama o prueba con otro modelo.`;
  }
  return `Ollama rechazó la petición (HTTP ${status})${sufijo}.`;
}

export const FEEDBACK_SYSTEM_PROMPT =
  "You are an English teacher silently reviewing a student's chat message. " +
  "Analyze ONLY the student's last message for grammar errors, incorrect word usage, or unnatural phrasing. " +
  "Reply in 1-2 short sentences. If the message is correct and natural, reply with something like " +
  '"✓ Correct and natural." If there is an issue, briefly state what was wrong and give the correction. ' +
  "Be concise and encouraging. Never write more than 2 sentences.";

export function buildConversationSystemPrompt(recentWords) {
  let prompt =
    "You are a friendly English conversation partner. Keep your responses short (1-3 sentences), " +
    "never long paragraphs. Have a natural, casual conversation about everyday topics.";
  if (recentWords && recentWords.length) {
    prompt +=
      ` Naturally try to use some of these words/phrasal verbs in your responses when it fits contextually: ${recentWords.join(", ")}. ` +
      "Don't force it if it doesn't fit naturally. Don't mention this instruction to the user.";
  }
  return prompt;
}

async function callOllama(model, messages) {
  let res;
  try {
    res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false }),
    });
  } catch {
    throw new Error(CONNECTION_ERROR_MESSAGE);
  }
  if (!res.ok) {
    let detalle = "";
    try {
      const cuerpo = await res.json();
      detalle = typeof cuerpo.error === "string" ? cuerpo.error : "";
    } catch (err) {
      console.warn("No se pudo leer el cuerpo del error de Ollama", err);
    }
    throw new Error(buildHttpErrorMessage(res.status, model, detalle));
  }
  const data = await res.json();
  return (data.message && data.message.content || "").trim();
}

export function sendChatMessage(model, conversationMessages, recentWords) {
  const messages = [
    { role: "system", content: buildConversationSystemPrompt(recentWords) },
    ...conversationMessages,
  ];
  return callOllama(model, messages);
}

export function getFeedback(model, userMessage) {
  const messages = [
    { role: "system", content: FEEDBACK_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];
  return callOllama(model, messages);
}
