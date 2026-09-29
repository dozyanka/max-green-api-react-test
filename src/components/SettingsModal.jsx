import { useState } from 'react';
import { CloseIcon, LogoutIcon, RefreshIcon } from './Icons.jsx';

export function SettingsModal({ credentials, api, instanceState, connectionState, onStateChecked, onLogout, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function refreshState() {
    setBusy(true);
    setError('');
    try {
      const state = await api.getStateInstance();
      onStateChecked(state?.stateInstance || 'unknown');
    } catch (requestError) {
      setError(requestError?.message || 'Не удалось получить состояние инстанса.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card modal-card--settings" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-card__header">
          <div>
            <span className="eyebrow">GREEN-API</span>
            <h2 id="settings-title">Подключение</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </div>

        <div className="settings-grid">
          <div className="settings-item">
            <span>idInstance</span>
            <strong>{credentials.idInstance}</strong>
          </div>
          <div className="settings-item settings-item--full">
            <span>apiUrl</span>
            <strong className="break-anywhere">{credentials.apiUrl}</strong>
          </div>
          <div className="settings-item">
            <span>Инстанс</span>
            <strong>{instanceState || '—'}</strong>
          </div>
          <div className="settings-item">
            <span>Получение сообщений</span>
            <strong>{connectionState === 'online' ? 'онлайн' : connectionState === 'retrying' ? 'повторное подключение' : 'подключение'}</strong>
          </div>
        </div>

        <div className="security-note">
          Токен не встроен в код проекта. Если не включать «Запомнить токен», он хранится только в sessionStorage текущей вкладки браузера.
        </div>

        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <div className="settings-actions">
          <button className="secondary-button secondary-button--icon" type="button" onClick={refreshState} disabled={busy}>
            <RefreshIcon size={18} /> {busy ? 'Проверка…' : 'Проверить инстанс'}
          </button>
          <button className="danger-button" type="button" onClick={onLogout}>
            <LogoutIcon size={18} /> Выйти
          </button>
        </div>
      </section>
    </div>
  );
}
