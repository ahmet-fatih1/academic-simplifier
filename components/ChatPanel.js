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
  t,
}) {
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
    <>
      <div className={styles.chatHeader}>
        <span className={styles.chatTitle}>{t.panelTitle}</span>
        <button
          className={styles.chatCloseBtn}
          onClick={onToggle}
          aria-label={t.panelClose}
        >
          ✕
        </button>
      </div>

      <div className={styles.chatMessages}>
        {messages.length === 0 && !streaming && (
          <p className={styles.chatWelcome}>
            {t.welcome}
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
          placeholder={t.placeholder}
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
          {t.send}
        </button>
      </div>

      {!isPro && (
        <div className={styles.chatQuota}>
          {t.quota(remainingQuota)}
        </div>
      )}
    </>
  );
}
