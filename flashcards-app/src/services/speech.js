// SRP: toda la lógica de Web Speech API en un único módulo
export const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export function speakText(text, e) {
  if (e) e.stopPropagation();
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}
