import { useState } from 'react';
import { CloseIcon } from './Icons.jsx';
import { formatPhone } from '../utils/format.js';
import { normalizePhone, validateMaxPhone } from '../api/greenApi.js';

export function NewChatModal({ api, onClose, onCreated }) {
  const [mode, setMode] = useState('phone');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      let chatId = '';
      let phoneNumber = '';
      let info = null;

      if (mode === 'phone') {
        const { phone, valid } = validateMaxPhone(value);
        if (!valid) {
          throw new Error('Введите номер РФ или РБ в международном формате: 7… или 375…');
        }

        const account = await api.checkAccount(phone);
        if (!account?.exist || !account?.chatId) {
          throw new Error('На этом номере не найден аккаунт MAX.');
        }

        chatId = String(account.chatId);
        phoneNumber = phone;
      } else {
        chatId = value.trim();
        if (!/^-?\d+$/.test(chatId)) {
          throw new Error('chatId должен содержать только цифры и, для групп, может начинаться с минуса.');
        }
      }

      try {
        info = await api.getContactInfo(chatId);
      } catch {
        info = null;
      }

      const resolvedPhone = info?.phoneNumber && Number(info.phoneNumber) > 0
        ? String(info.phoneNumber)
        : phoneNumber;
      const name = info?.contactName || info?.name || (resolvedPhone ? formatPhone(resolvedPhone) : `Чат ${chatId}`);

      onCreated({
        chatId,
        phoneNumber: resolvedPhone,
        name,
        avatar: info?.avatar || '',
        updatedAt: Date.now(),
        createdAt: Date.now(),
      });
    } catch (requestError) {
      setError(requestError?.message || 'Не удалось создать чат.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-chat-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-card__header">
          <div>
            <span className="eyebrow">Новый диалог</span>
            <h2 id="new-chat-title">Создать чат</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </div>

        <div className="segmented-control">
          <button type="button" className={mode === 'phone' ? 'is-active' : ''} onClick={() => { setMode('phone'); setValue(''); setError(''); }}>
            По номеру
          </button>
          <button type="button" className={mode === 'chatId' ? 'is-active' : ''} onClick={() => { setMode('chatId'); setValue(''); setError(''); }}>
            По chatId
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>{mode === 'phone' ? 'Номер телефона получателя' : 'chatId получателя'}</span>
            <input
              autoFocus
              value={value}
              onChange={(event) => setValue(mode === 'phone' ? normalizePhone(event.target.value) : event.target.value)}
              inputMode={mode === 'phone' ? 'tel' : 'numeric'}
              placeholder={mode === 'phone' ? '79991234567' : '10000000'}
              disabled={busy}
            />
            <small>
              {mode === 'phone'
                ? 'GREEN-API CheckAccount для MAX принимает номера РФ (+7) и РБ (+375) и возвращает постоянный chatId.'
                : 'Прямой chatId удобен, если он уже известен из уведомления или списка контактов.'}
            </small>
          </label>

          {error ? <div className="form-error" role="alert">{error}</div> : null}

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Отмена</button>
            <button className="primary-button" type="submit" disabled={busy || !value.trim()}>
              {busy ? 'Проверка…' : 'Создать чат'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
