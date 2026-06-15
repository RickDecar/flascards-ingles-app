import { useState, useEffect, useRef } from "react";
import {
  sendChatMessage,
  getFeedback,
  DEFAULT_MODEL,
  MODEL_STORAGE_KEY,
} from "./ollama";

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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  }, [model]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage = { role: "user", content: text };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setError(null);
    setSending(true);

    const feedbackId = Date.now();
    setFeedback(f => [...f, { id: feedbackId, forMessage: text, text: "", loading: true }]);
    getFeedback(model, text)
      .then(feedbackText => {
        setFeedback(f => f.map(item => item.id === feedbackId ? { ...item, text: feedbackText, loading: false } : item));
      })
      .catch(() => {
        setFeedback(f => f.filter(item => item.id !== feedbackId));
      });

    try {
      const reply = await sendChatMessage(model, history, recentWords);
      setMessages(m => [...m, { role: "assistant", content: reply }]);
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

  return (
    <main className="chat-view">
      <div className="chat-header">
        <h2>💬 Conversar</h2>
        <div className="model-select-row">
          <label htmlFor="ollama-model">Modelo Ollama</label>
          <input
            id="ollama-model"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder={DEFAULT_MODEL}
          />
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
              <p className="chat-empty">Escribe algo en inglés para empezar a conversar con la IA.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
            ))}
            {sending && <div className="chat-bubble assistant typing">···</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-row">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe en inglés..."
              disabled={sending}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={sending || !input.trim()}>Enviar</button>
          </div>
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
