import { useState, useEffect, useRef } from "react";
import {
  sendChatMessage,
  getFeedback,
  DEFAULT_MODEL,
  MODEL_STORAGE_KEY,
} from "./ollama";
import { speakText, SpeechRecognitionAPI } from "./services/speech";

function FeedbackList({ items }) {
  if (items.length === 0) {
    return <p className="feedback-empty">Aquí verás sugerencias sobre tu inglés mientras conversas.</p>;
  }
  return (
    <div className="feedback-list">
      {items.map(item => (
        <div
          key={item.id}
          className={`feedback-entry ${item.loading ? "loading" : item.text.trim().startsWith("✓") ? "positive" : "issue"}`}
        >
          <div className="feedback-quote">"{item.forMessage}"</div>
          <div className="feedback-text">{item.loading ? "Analizando..." : item.text}</div>
        </div>
      ))}
    </div>
  );
}

export default function ChatView({ recentWords }) {
  const [model, setModel] = useState(() => localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  }, [model]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Detener reconocimiento al desmontar
  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    const userMessage = { role: "user", content: msg };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setError(null);
    setSending(true);

    const feedbackId = Date.now();
    setFeedback(f => [...f, { id: feedbackId, forMessage: msg, text: "", loading: true }]);
    getFeedback(model, msg)
      .then(feedbackText => {
        setFeedback(f => f.map(item => item.id === feedbackId ? { ...item, text: feedbackText, loading: false } : item));
      })
      .catch(() => {
        setFeedback(f => f.filter(item => item.id !== feedbackId));
      });

    try {
      const reply = await sendChatMessage(model, history, recentWords);
      setMessages(m => [...m, { role: "assistant", content: reply }]);
      if (autoSpeak) speakText(reply);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startListening = () => {
    if (!SpeechRecognitionAPI) {
      setError("Tu navegador no soporta el reconocimiento de voz.");
      return;
    }
    if (listening) {
      recognitionRef.current?.abort();
      return;
    }

    window.speechSynthesis.cancel();

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      handleSend(transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <main className="chat-view">
      <div className="chat-header">
        <h2>💬 Conversar</h2>
        <div className="chat-header-controls">
          <div className="model-select-row">
            <label htmlFor="ollama-model">Modelo Ollama</label>
            <input
              id="ollama-model"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder={DEFAULT_MODEL}
            />
          </div>
          <button
            className={`autospeak-toggle ${autoSpeak ? "on" : ""}`}
            onClick={() => { setAutoSpeak(s => !s); window.speechSynthesis.cancel(); }}
            title={autoSpeak ? "Auto-lectura activada — pulsa para desactivar" : "Auto-lectura desactivada — pulsa para activar"}
          >
            {autoSpeak ? "🔊 Voz ON" : "🔇 Voz OFF"}
          </button>
        </div>
      </div>

      {recentWords.length > 0 && (
        <p className="chat-hint">
          El modelo intentará usar palabras que estás repasando: {recentWords.slice(0, 6).join(", ")}{recentWords.length > 6 ? "..." : ""}
        </p>
      )}

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-layout">
        <div className="chat-main">
          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-empty">Escribe o habla en inglés para empezar a conversar con la IA.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                {m.content}
                {m.role === "assistant" && (
                  <button
                    className="bubble-speak-btn"
                    onClick={() => speakText(m.content)}
                    title="Escuchar respuesta"
                  >
                    🔊
                  </button>
                )}
              </div>
            ))}
            {sending && <div className="chat-bubble assistant typing">···</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-row">
            <button
              className={`chat-mic-btn ${listening ? "listening" : ""}`}
              onClick={startListening}
              disabled={sending}
              title={listening ? "Escuchando... pulsa para cancelar" : "Hablar en inglés"}
            >
              {listening ? "🎙️" : "🎤"}
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? "Escuchando..." : "Escribe en inglés..."}
              disabled={sending || listening}
            />
            <button className="chat-send-btn" onClick={() => handleSend()} disabled={sending || listening || !input.trim()}>Enviar</button>
          </div>
          {listening && <p className="chat-listening-hint">🎙️ Escuchando... habla en inglés y enviaré tu mensaje automáticamente.</p>}
        </div>

        <aside className="feedback-panel">
          <h3>📝 Feedback</h3>
          <FeedbackList items={feedback} />
        </aside>
      </div>

      <button className="feedback-fab" onClick={() => setFeedbackOpen(true)} title="Ver feedback">📝</button>

      {feedbackOpen && (
        <div className="feedback-drawer-overlay" onClick={() => setFeedbackOpen(false)}>
          <div className="feedback-drawer" onClick={e => e.stopPropagation()}>
            <div className="feedback-drawer-header">
              <h3>📝 Feedback</h3>
              <button className="close-msg-btn" onClick={() => setFeedbackOpen(false)}>✕</button>
            </div>
            <FeedbackList items={feedback} />
          </div>
        </div>
      )}
    </main>
  );
}
