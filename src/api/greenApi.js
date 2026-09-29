const DEFAULT_TIMEOUT_SECONDS = 5;

export class GreenApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'GreenApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function normalizeBaseUrl(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
}

export function deriveApiUrl(idInstance) {
  const digits = String(idInstance ?? '').replace(/\D/g, '');
  if (digits.length >= 4) {
    return `https://${digits.slice(0, 4)}.api.green-api.com`;
  }
  return 'https://api.green-api.com';
}

export function normalizePhone(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function validateMaxPhone(value) {
  const phone = normalizePhone(value);
  const validLength = phone.length === 11 || phone.length === 12;
  const validPrefix = phone.startsWith('7') || phone.startsWith('375');
  return {
    phone,
    valid: validLength && validPrefix,
  };
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function payloadMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  return payload.message || payload.reason || payload.description || payload.error || fallback;
}

export function createGreenApiClient(credentials, fetchImpl = fetch) {
  const baseUrl = normalizeBaseUrl(credentials.apiUrl || deriveApiUrl(credentials.idInstance));
  const idInstance = String(credentials.idInstance ?? '').trim();
  const apiTokenInstance = String(credentials.apiTokenInstance ?? '').trim();

  if (!baseUrl || !idInstance || !apiTokenInstance) {
    throw new Error('GREEN-API credentials are incomplete.');
  }

  const endpoint = (method, suffix = '') =>
    `${baseUrl}/waInstance${encodeURIComponent(idInstance)}/${method}/${encodeURIComponent(apiTokenInstance)}${suffix}`;

  async function request(method, options = {}) {
    const response = await fetchImpl(endpoint(method, options.suffix), {
      method: options.httpMethod || 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });

    const payload = await parseResponse(response);
    if (!response.ok) {
      throw new GreenApiError(
        payloadMessage(payload, `GREEN-API request failed with HTTP ${response.status}`),
        response.status,
        payload,
      );
    }

    if (payload && typeof payload === 'object' && payload.status === false && payload.reason) {
      throw new GreenApiError(payload.reason, response.status, payload);
    }

    return payload;
  }

  return {
    credentials: {
      apiUrl: baseUrl,
      idInstance,
      apiTokenInstance,
    },

    getStateInstance(signal) {
      return request('getStateInstance', { signal });
    },

    checkAccount(phoneNumber, signal) {
      const { phone, valid } = validateMaxPhone(phoneNumber);
      if (!valid) {
        throw new GreenApiError(
          'Для CheckAccount нужен номер РФ или РБ в международном формате: 7… или 375…',
          400,
        );
      }

      return request('checkAccount', {
        httpMethod: 'POST',
        body: { phoneNumber: Number(phone) },
        signal,
      });
    },

    getContactInfo(chatId, signal) {
      return request('getContactInfo', {
        httpMethod: 'POST',
        body: { chatId: String(chatId) },
        signal,
      });
    },

    sendMessage(chatId, message, signal) {
      const text = String(message ?? '').trim();
      if (!text) throw new GreenApiError('Нельзя отправить пустое сообщение.', 400);

      return request('sendMessage', {
        httpMethod: 'POST',
        body: {
          chatId: String(chatId),
          message: text,
        },
        signal,
      });
    },

    receiveNotification(receiveTimeout = DEFAULT_TIMEOUT_SECONDS, signal) {
      const safeTimeout = Math.min(60, Math.max(5, Number(receiveTimeout) || DEFAULT_TIMEOUT_SECONDS));
      return request('receiveNotification', {
        suffix: `?receiveTimeout=${safeTimeout}`,
        signal,
      });
    },

    deleteNotification(receiptId, signal) {
      return request('deleteNotification', {
        httpMethod: 'DELETE',
        suffix: `/${encodeURIComponent(receiptId)}`,
        signal,
      });
    },
  };
}

export function extractTextNotification(body) {
  if (!body || body.typeWebhook !== 'incomingMessageReceived') return null;

  const messageData = body.messageData || {};
  let text = '';

  if (messageData.typeMessage === 'textMessage') {
    text = messageData.textMessageData?.textMessage || '';
  } else if (messageData.typeMessage === 'extendedTextMessage') {
    text = messageData.extendedTextMessageData?.text || '';
  } else if (messageData.typeMessage === 'quotedMessage') {
    text = messageData.extendedTextMessageData?.text || '';
  } else {
    return null;
  }

  const senderData = body.senderData || {};
  const chatId = String(senderData.chatId || '');
  if (!chatId || !text) return null;

  return {
    id: String(body.idMessage || `incoming-${body.timestamp || Date.now()}-${chatId}`),
    chatId,
    text,
    timestamp: Number(body.timestamp) ? Number(body.timestamp) * 1000 : Date.now(),
    senderName: senderData.senderName || senderData.chatName || '',
    chatName: senderData.chatName || senderData.senderName || '',
    phoneNumber: senderData.senderPhoneNumber ? String(senderData.senderPhoneNumber) : '',
  };
}
