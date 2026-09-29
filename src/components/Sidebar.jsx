import { useMemo, useState } from 'react';
import { Avatar } from './Avatar.jsx';
import { Brand } from './Brand.jsx';
import { ChatIcon, MoonIcon, PlusIcon, SearchIcon, SettingsIcon, SunIcon } from './Icons.jsx';
import { formatChatTime, formatPhone } from '../utils/format.js';

export function Sidebar({
  chats,
  activeChatId,
  connectionState,
  theme,
  onSelectChat,
  onNewChat,
  onSettings,
  onToggleTheme,
}) {
  const [query, setQuery] = useState('');

  const filteredChats = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return chats;

    return chats.filter((chat) => {
      const haystack = [chat.name, chat.chatId, chat.phoneNumber, chat.lastMessage]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [chats, query]);

  return (
    <aside className="sidebar">
      <nav className="rail" aria-label="Основная навигация">
        <div className="rail__brand"><Brand compact /></div>
        <button className="rail-button is-active" type="button" aria-label="Чаты" title="Чаты">
          <ChatIcon />
        </button>
        <div className="rail__spacer" />
        <button className="rail-button" type="button" onClick={onToggleTheme} aria-label="Переключить тему" title="Переключить тему">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className="rail-button" type="button" onClick={onSettings} aria-label="Настройки" title="Настройки">
          <SettingsIcon />
        </button>
      </nav>

      <div className="chat-list-panel">
        <div className="chat-list-panel__header">
          <div>
            <h2>Чаты</h2>
            <div className="connection-label">
              <span className={`status-dot status-dot--${connectionState}`} />
              {connectionState === 'online' ? 'GREEN-API онлайн' : connectionState === 'retrying' ? 'Переподключение' : 'Подключение'}
            </div>
          </div>
          <button className="new-chat-button" type="button" onClick={onNewChat} aria-label="Новый чат" title="Новый чат">
            <PlusIcon />
          </button>
        </div>

        <label className="search-box">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск"
            aria-label="Поиск по чатам"
          />
        </label>

        <div className="chat-list" role="list">
          {filteredChats.length === 0 ? (
            <div className="chat-list__empty">
              <div className="chat-list__empty-icon"><ChatIcon size={28} /></div>
              <strong>{query ? 'Ничего не найдено' : 'Пока нет чатов'}</strong>
              <p>{query ? 'Попробуйте другой запрос.' : 'Нажмите + и создайте диалог по номеру телефона.'}</p>
            </div>
          ) : filteredChats.map((chat) => (
            <button
              key={chat.chatId}
              type="button"
              role="listitem"
              className={`chat-row ${activeChatId === chat.chatId ? 'is-active' : ''}`}
              onClick={() => onSelectChat(chat.chatId)}
            >
              <Avatar name={chat.name} src={chat.avatar} />
              <span className="chat-row__content">
                <span className="chat-row__topline">
                  <strong>{chat.name || `Чат ${chat.chatId}`}</strong>
                  <time>{formatChatTime(chat.updatedAt)}</time>
                </span>
                <span className="chat-row__bottomline">
                  <span>{chat.lastMessage || formatPhone(chat.phoneNumber) || `chatId ${chat.chatId}`}</span>
                  {chat.unread > 0 ? <b className="unread-badge">{chat.unread > 99 ? '99+' : chat.unread}</b> : null}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
