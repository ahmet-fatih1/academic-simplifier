import { useRef, useEffect } from "react";
import styles from "../styles/Home.module.css";

const MAX_MESSAGE_LENGTH = 2000;

export default function ChatPanel({
  isOpen,
  onToggle,
  messages,
  onSend,
  streaming,
  streamingText,
  remainingQuota,
  isPro,
}) {
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingText]);

  const handleSend = () => {
    if (streaming) return;
    const val = chatInputRef.current?.value?.trim();
    if (!val || val.length > MAX_MESSAGE_LENGTH) return;
    onSend(val);
    chatInputRef.current.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <span className={styles.chatTitle}>Chat with AI</span>
        <button
          className={styles.chatCloseBtn}
          onClick={onToggle}
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>

      <div className={styles.chatMessages}>
        {messages.length === 0 && !streaming && (
          <p className={styles.chatWelcome}>
            Metniniz hakkında sorularınızı sorabilirsiniz.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === "user" ? styles.chatUserMsg : styles.chatBotMsg
            }
          >
            {msg.content}
          </div>
        ))}
        {streaming && (
          <div className={styles.chatBotMsg}>
            {streamingText}
            <span className={styles.chatCursor}>|</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.chatInputArea}>
        <textarea
          ref={chatInputRef}
          className={styles.chatInput}
          placeholder="Sorunuzu yazın..."
          rows={1}
          onKeyDown={handleKeyDown}
          disabled={streaming}
        />
        <button
          className={
            streaming ? styles.chatSendBtnDisabled : styles.chatSendBtn
          }
          onClick={handleSend}
          disabled={streaming}
        >
          Send
        </button>
      </div>

      {!isPro && (
        <div className={styles.chatQuota}>
          {remainingQuota}/10 mesaj kaldı
        </div>
      )}
    </div>
  );
}
