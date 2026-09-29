const CREDENTIALS_KEY = 'max-green-api:credentials';
const CHAT_STATE_PREFIX = 'max-green-api:chat-state:';
const THEME_KEY = 'max-green-api:theme';

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function storageOrNull(type) {
  try {
    return type === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function loadCredentials() {
  const session = storageOrNull('session');
  const local = storageOrNull('local');
  return safeParse(session?.getItem(CREDENTIALS_KEY), null) || safeParse(local?.getItem(CREDENTIALS_KEY), null);
}

export function saveCredentials(credentials, remember) {
  const session = storageOrNull('session');
  const local = storageOrNull('local');

  if (remember) {
    local?.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
    session?.removeItem(CREDENTIALS_KEY);
  } else {
    session?.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
    local?.removeItem(CREDENTIALS_KEY);
  }
}

export function clearCredentials() {
  storageOrNull('session')?.removeItem(CREDENTIALS_KEY);
  storageOrNull('local')?.removeItem(CREDENTIALS_KEY);
}

export function loadChatState(idInstance) {
  const local = storageOrNull('local');
  return safeParse(local?.getItem(`${CHAT_STATE_PREFIX}${idInstance}`), null);
}

export function saveChatState(idInstance, state) {
  if (!idInstance) return;
  storageOrNull('local')?.setItem(`${CHAT_STATE_PREFIX}${idInstance}`, JSON.stringify(state));
}

export function loadTheme() {
  return storageOrNull('local')?.getItem(THEME_KEY) || 'light';
}

export function saveTheme(theme) {
  storageOrNull('local')?.setItem(THEME_KEY, theme);
}
