import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar.jsx';
import { SendIcon } from './Icons.jsx';
import { formatMessageTime, formatPhone } from '../utils/format.js';

function MessageStatus({ message }) {
  if (message.direction !== 'outgoing') return null;
  if (message.status === 'sending') return <span className="message-status">•</span>;
  if (message.status === 'error') return <span className="message-status message-status--error">!</span>;
  return <span className="message-status">✓✓</span>;
}

export function ChatPane({ chat, messages, onSend, onRetry }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const textAreaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, chat?.chatId]);

  useEffect(() => {
    setText('');
    textAreaRef.current?.focus();
  }, [chat?.chatId]);

  if (!chat) {
    return (
      <main className="empty-pane">
        <div className="empty-pane__card">
          <div className="empty-pane__logo"><span /></div>
          <h1>MAX Bridge</h1>
          <p>Выберите чат слева или создайте новый диалог по номеру телефона.</p>
          <small>Только текстовые сообщения · GREEN-API HTTP API</small>
        </div>
      </main>
    );
  }

  function submitMessage() {
    const value = text.trim();
    if (!value) return;
    onSend(chat.chatId, value);
    setText('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  return (
    <main className="chat-pane">
      <header className="chat-header">
        <Avatar name={chat.name} src={chat.avatar} />
        <div className="chat-header__text">
          <strong>{chat.name || `Чат ${chat.chatId}`}</strong>
          <span>{formatPhone(chat.phoneNumber) || `chatId ${chat.chatId}`}</span>
        </div>
        <div className="chat-header__badge">MAX · GREEN-API</div>
      </header>

      <section className="message-area" aria-live="polite">
        <div className="message-area__inner">
          {messages.length === 0 ? (
            <div className="conversation-start">
              <span>Новый диалог</span>
              <p>Напишите первое текстовое сообщение.</p>
            </div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className={`message-row message-row--${message.direction}`}>
              <div className={`message-bubble ${message.status === 'error' ? 'message-bubble--error' : ''}`}>
                <p>{message.text}</p>
                <div className="message-meta">
                  <time>{formatMessageTime(message.timestamp)}</time>
                  <MessageStatus message={message} />
                </div>
                {message.status === 'error' ? (
                  <button className="retry-link" type="button" onClick={() => onRetry(message)}>
                    Повторить отправку
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </section>

      <footer className="composer-wrap">
        <div className="composer">
          <textarea
            ref={textAreaRef}
            rows="1"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение"
            maxLength={20000}
            aria-label="Текст сообщения"
          />
          <button className="send-button" type="button" onClick={submitMessage} disabled={!text.trim()} aria-label="Отправить сообщение">
            <SendIcon />
          </button>
        </div>
        <div className="composer-hint">Enter — отправить · Shift+Enter — новая строка</div>
      </footer>
    </main>
  );
}
