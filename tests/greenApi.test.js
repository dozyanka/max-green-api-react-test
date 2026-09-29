import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveApiUrl,
  extractTextNotification,
  normalizeBaseUrl,
  validateMaxPhone,
} from '../src/api/greenApi.js';

test('deriveApiUrl uses the MAX cluster prefix from idInstance', () => {
  assert.equal(deriveApiUrl('3100000000'), 'https://3100.api.green-api.com');
});

test('normalizeBaseUrl removes trailing slashes', () => {
  assert.equal(normalizeBaseUrl('https://3100.api.green-api.com///'), 'https://3100.api.green-api.com');
});

test('validateMaxPhone accepts Russian and Belarusian international numbers', () => {
  assert.deepEqual(validateMaxPhone('+7 (999) 123-45-67'), {
    phone: '79991234567',
    valid: true,
  });
  assert.equal(validateMaxPhone('+375 29 123 45 67').valid, true);
  assert.equal(validateMaxPhone('+49 151 123456').valid, false);
});

test('extractTextNotification parses incoming MAX text notification', () => {
  const parsed = extractTextNotification({
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1763115112,
    idMessage: '1763115112345',
    senderData: {
      chatId: '10000000',
      chatName: 'Иван',
      senderName: 'Иван',
      senderPhoneNumber: 79991234567,
    },
    messageData: {
      typeMessage: 'textMessage',
      textMessageData: { textMessage: 'Привет!' },
    },
  });

  assert.equal(parsed.chatId, '10000000');
  assert.equal(parsed.text, 'Привет!');
  assert.equal(parsed.phoneNumber, '79991234567');
});

test('extractTextNotification ignores non-text notifications', () => {
  assert.equal(extractTextNotification({
    typeWebhook: 'incomingMessageReceived',
    senderData: { chatId: '10000000' },
    messageData: { typeMessage: 'imageMessage' },
  }), null);
});
