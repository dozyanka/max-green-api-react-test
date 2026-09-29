export function createEmptyChatState() {
  return {
    chats: [],
    messagesByChat: {},
    activeChatId: null,
  };
}

export function hydrateChatState(value) {
  const empty = createEmptyChatState();
  if (!value || typeof value !== 'object') return empty;

  return {
    chats: Array.isArray(value.chats) ? value.chats : [],
    messagesByChat: value.messagesByChat && typeof value.messagesByChat === 'object' ? value.messagesByChat : {},
    activeChatId: value.activeChatId || null,
  };
}

function upsertChat(chats, nextChat) {
  const index = chats.findIndex((chat) => chat.chatId === nextChat.chatId);
  if (index === -1) return [nextChat, ...chats];

  const merged = {
    ...chats[index],
    ...nextChat,
  };
  const next = [...chats];
  next[index] = merged;
  return next;
}

function sortChats(chats) {
  return [...chats].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
}

export function chatReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return hydrateChatState(action.payload);

    case 'UPSERT_CHAT': {
      const chat = {
        unread: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...action.payload,
      };
      return {
        ...state,
        chats: sortChats(upsertChat(state.chats, chat)),
      };
    }

    case 'SET_ACTIVE_CHAT': {
      const activeChatId = action.chatId || null;
      return {
        ...state,
        activeChatId,
        chats: state.chats.map((chat) =>
          chat.chatId === activeChatId ? { ...chat, unread: 0 } : chat,
        ),
      };
    }

    case 'ADD_MESSAGE': {
      const message = action.message;
      const current = state.messagesByChat[message.chatId] || [];
      if (current.some((item) => item.id === message.id || (message.serverId && item.serverId === message.serverId))) {
        return state;
      }

      const timestamp = Number(message.timestamp || Date.now());
      const existingChat = state.chats.find((chat) => chat.chatId === message.chatId);
      const unreadIncrease = message.direction === 'incoming' && state.activeChatId !== message.chatId ? 1 : 0;
      const chat = {
        chatId: message.chatId,
        name: existingChat?.name || message.senderName || message.chatId,
        phoneNumber: existingChat?.phoneNumber || message.phoneNumber || '',
        avatar: existingChat?.avatar || '',
        createdAt: existingChat?.createdAt || timestamp,
        updatedAt: timestamp,
        lastMessage: message.text,
        unread: Number(existingChat?.unread || 0) + unreadIncrease,
      };

      return {
        ...state,
        chats: sortChats(upsertChat(state.chats, chat)),
        messagesByChat: {
          ...state.messagesByChat,
          [message.chatId]: [...current, message].sort((a, b) => a.timestamp - b.timestamp),
        },
      };
    }

    case 'PATCH_MESSAGE': {
      const list = state.messagesByChat[action.chatId] || [];
      return {
        ...state,
        messagesByChat: {
          ...state.messagesByChat,
          [action.chatId]: list.map((message) =>
            message.id === action.messageId ? { ...message, ...action.patch } : message,
          ),
        },
      };
    }

    case 'CLEAR':
      return createEmptyChatState();

    default:
      return state;
  }
}
