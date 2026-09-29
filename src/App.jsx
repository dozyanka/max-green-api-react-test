import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { createGreenApiClient, extractTextNotification } from './api/greenApi.js';
import { AuthScreen } from './components/AuthScreen.jsx';
import { ChatPane } from './components/ChatPane.jsx';
import { NewChatModal } from './components/NewChatModal.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Toast } from './components/Toast.jsx';
import { useNotificationPoller } from './hooks/useNotificationPoller.js';
import { chatReducer, createEmptyChatState } from './state/chatReducer.js';
import {
  clearCredentials,
  loadChatState,
  loadCredentials,
  loadTheme,
  saveChatState,
  saveCredentials,
  saveTheme,
} from './storage/storage.js';
import { localId } from './utils/id.js';

function App() {
  const [credentials, setCredentials] = useState(() => loadCredentials());
  const [instanceState, setInstanceState] = useState('unknown');
  const [connectionState, setConnectionState] = useState('connecting');
  const [chatState, dispatch] = useReducer(chatReducer, undefined, createEmptyChatState);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => loadTheme());

  const api = useMemo(() => {
    if (!credentials) return null;
    try {
      return createGreenApiClient(credentials);
    } catch {
      return null;
    }
  }, [credentials]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!credentials?.idInstance) {
      dispatch({ type: 'CLEAR' });
      return;
    }

    dispatch({
      type: 'HYDRATE',
      payload: loadChatState(credentials.idInstance),
    });
  }, [credentials?.idInstance]);

  useEffect(() => {
    if (credentials?.idInstance) {
      saveChatState(credentials.idInstance, chatState);
    }
  }, [chatState, credentials?.idInstance]);

  useEffect(() => {
    if (!api) return undefined;
    const controller = new AbortController();

    api.getStateInstance(controller.signal)
      .then((state) => setInstanceState(state?.stateInstance || 'unknown'))
      .catch(() => undefined);

    return () => controller.abort();
  }, [api]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleIncomingNotification = useCallback(async (body) => {
    const incoming = extractTextNotification(body);
    if (!incoming) return;

    dispatch({
      type: 'UPSERT_CHAT',
      payload: {
        chatId: incoming.chatId,
        name: incoming.chatName || incoming.senderName || `Чат ${incoming.chatId}`,
        phoneNumber: incoming.phoneNumber,
        updatedAt: incoming.timestamp,
      },
    });

    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: incoming.id,
        serverId: incoming.id,
        chatId: incoming.chatId,
        text: incoming.text,
        timestamp: incoming.timestamp,
        direction: 'incoming',
        status: 'received',
        senderName: incoming.senderName,
        phoneNumber: incoming.phoneNumber,
      },
    });
  }, []);

  const handlePollError = useCallback(() => {
    // The poller retries automatically. We deliberately avoid showing a toast
    // for every transient network failure.
  }, []);

  useNotificationPoller({
    api,
    enabled: Boolean(api && credentials),
    onNotification: handleIncomingNotification,
    onStateChange: setConnectionState,
    onError: handlePollError,
  });

  function handleAuthenticated(nextCredentials, remember, state) {
    saveCredentials(nextCredentials, remember);
    setCredentials(nextCredentials);
    setInstanceState(state);
    setConnectionState('connecting');
  }

  function handleLogout() {
    clearCredentials();
    setSettingsOpen(false);
    setCredentials(null);
    setInstanceState('unknown');
    setConnectionState('connecting');
  }

  function handleChatCreated(chat) {
    dispatch({ type: 'UPSERT_CHAT', payload: chat });
    dispatch({ type: 'SET_ACTIVE_CHAT', chatId: chat.chatId });
    setNewChatOpen(false);
    setToast({ type: 'success', title: 'Чат готов', message: 'Можно отправлять текстовые сообщения.' });
  }

  async function performSend(chatId, text, messageId) {
    if (!api) return;

    try {
      const result = await api.sendMessage(chatId, text);
      dispatch({
        type: 'PATCH_MESSAGE',
        chatId,
        messageId,
        patch: {
          status: 'sent',
          serverId: result?.idMessage || result?.messageId || undefined,
        },
      });
    } catch (error) {
      dispatch({
        type: 'PATCH_MESSAGE',
        chatId,
        messageId,
        patch: {
          status: 'error',
          error: error?.message || 'Ошибка отправки',
        },
      });
      setToast({
        type: 'error',
        title: 'Сообщение не отправлено',
        message: error?.message || 'Проверьте соединение и параметры GREEN-API.',
      });
    }
  }

  function handleSend(chatId, text) {
    const id = localId('outgoing');
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id,
        chatId,
        text,
        timestamp: Date.now(),
        direction: 'outgoing',
        status: 'sending',
      },
    });
    performSend(chatId, text, id);
  }

  function handleRetry(message) {
    dispatch({
      type: 'PATCH_MESSAGE',
      chatId: message.chatId,
      messageId: message.id,
      patch: { status: 'sending', error: undefined },
    });
    performSend(message.chatId, message.text, message.id);
  }

  if (!credentials || !api) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const activeChat = chatState.chats.find((chat) => chat.chatId === chatState.activeChatId) || null;
  const activeMessages = activeChat ? chatState.messagesByChat[activeChat.chatId] || [] : [];

  return (
    <div className="app-shell">
      <Sidebar
        chats={chatState.chats}
        activeChatId={chatState.activeChatId}
        connectionState={connectionState}
        theme={theme}
        onSelectChat={(chatId) => dispatch({ type: 'SET_ACTIVE_CHAT', chatId })}
        onNewChat={() => setNewChatOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      />

      <ChatPane
        chat={activeChat}
        messages={activeMessages}
        onSend={handleSend}
        onRetry={handleRetry}
      />

      {newChatOpen ? (
        <NewChatModal
          api={api}
          onClose={() => setNewChatOpen(false)}
          onCreated={handleChatCreated}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsModal
          credentials={api.credentials}
          api={api}
          instanceState={instanceState}
          connectionState={connectionState}
          onStateChecked={setInstanceState}
          onLogout={handleLogout}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
