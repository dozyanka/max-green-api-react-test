import test from 'node:test';
import assert from 'node:assert/strict';
import { chatReducer, createEmptyChatState } from '../src/state/chatReducer.js';

test('adding an incoming message creates a chat and increments unread', () => {
  const next = chatReducer(createEmptyChatState(), {
    type: 'ADD_MESSAGE',
    message: {
      id: 'm1',
      chatId: '10000000',
      text: 'Привет',
      timestamp: 100,
      direction: 'incoming',
      senderName: 'Иван',
    },
  });

  assert.equal(next.chats.length, 1);
  assert.equal(next.chats[0].unread, 1);
  assert.equal(next.messagesByChat['10000000'][0].text, 'Привет');
});

test('active chat does not increment unread', () => {
  let state = chatReducer(createEmptyChatState(), {
    type: 'UPSERT_CHAT',
    payload: { chatId: '10000000', name: 'Иван', updatedAt: 10 },
  });
  state = chatReducer(state, { type: 'SET_ACTIVE_CHAT', chatId: '10000000' });
  state = chatReducer(state, {
    type: 'ADD_MESSAGE',
    message: {
      id: 'm2',
      chatId: '10000000',
      text: 'Ответ',
      timestamp: 20,
      direction: 'incoming',
    },
  });

  assert.equal(state.chats[0].unread, 0);
});

test('duplicate message id is ignored', () => {
  const message = {
    id: 'same',
    chatId: '10000000',
    text: 'Один раз',
    timestamp: 10,
    direction: 'incoming',
  };
  const first = chatReducer(createEmptyChatState(), { type: 'ADD_MESSAGE', message });
  const second = chatReducer(first, { type: 'ADD_MESSAGE', message });
  assert.equal(second.messagesByChat['10000000'].length, 1);
});
