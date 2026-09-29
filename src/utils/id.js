export function localId(prefix = 'local') {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now()}-${random}`;
}
