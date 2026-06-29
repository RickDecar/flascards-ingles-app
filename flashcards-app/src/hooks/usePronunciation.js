// SRP: lógica de reconocimiento de voz, completamente desacoplada del componente
import { useState, useEffect } from "react";
import { SpeechRecognitionAPI } from "../services/speech";

export function usePronunciation(currentWord) {
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [listening, setListening] = useState(false);

  // Resetea el resultado al cambiar de tarjeta
  useEffect(() => {
    setPronunciationResult(null);
    setListening(false);
  }, [currentWord]);

  const practice = (e) => {
    e.stopPropagation();
    if (!currentWord) return;
    if (!SpeechRecognitionAPI) {
      setPronunciationResult({ type: "unsupported" });
      return;
    }

    setPronunciationResult(null);
    setListening(true);

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const heard = event.results[0][0].transcript.trim();
      const match = heard.toLowerCase() === currentWord.trim().toLowerCase();
      setPronunciationResult({
        type: match ? "match" : "no-match",
        heard,
        expected: currentWord,
      });
    };

    recognition.onerror = () => setPronunciationResult({ type: "error" });
    recognition.onend = () => setListening(false);

    recognition.start();
  };

  return { pronunciationResult, listening, practice };
}
