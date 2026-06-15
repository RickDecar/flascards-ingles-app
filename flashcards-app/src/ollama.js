export const OLLAMA_URL = "http://localhost:11434/api/chat";
export const DEFAULT_MODEL = "llama3.2";
export const MODEL_STORAGE_KEY = "english_flashcards_ollama_model";

export const CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con Ollama en localhost:11434. Asegúrate de tener Ollama instalado y corriendo (`ollama serve`), y de haber descargado el modelo (`ollama pull llama3.2`).";

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
    throw new Error(CONNECTION_ERROR_MESSAGE);
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
