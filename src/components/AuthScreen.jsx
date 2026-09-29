import { useMemo, useState } from 'react';
import { Brand } from './Brand.jsx';
import { createGreenApiClient, deriveApiUrl } from '../api/greenApi.js';

const STATE_TEXT = {
  authorized: 'Инстанс авторизован и готов к работе.',
  suspended: 'Инстанс авторизован, но для аккаунта действуют временные ограничения.',
  starting: 'Инстанс запускается. Обычно это занимает до нескольких минут.',
  notAuthorized: 'Инстанс не авторизован. Сначала авторизуйте его в личном кабинете GREEN-API.',
  blocked: 'Аккаунт MAX заблокирован.',
  pendingPassword: 'Для инстанса требуется пароль двухфакторной авторизации.',
};

export function AuthScreen({ onAuthenticated }) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiUrlTouched, setApiUrlTouched] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const suggestedApiUrl = useMemo(() => deriveApiUrl(idInstance), [idInstance]);
  const effectiveApiUrl = apiUrlTouched ? apiUrl : suggestedApiUrl;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const digits = idInstance.replace(/\D/g, '');
    if (!digits) {
      setError('Введите idInstance.');
      return;
    }
    if (!apiTokenInstance.trim()) {
      setError('Введите apiTokenInstance.');
      return;
    }

    setBusy(true);
    try {
      const credentials = {
        idInstance: digits,
        apiTokenInstance: apiTokenInstance.trim(),
        apiUrl: effectiveApiUrl.trim() || deriveApiUrl(digits),
      };
      const api = createGreenApiClient(credentials);
      const state = await api.getStateInstance();
      const instanceState = state?.stateInstance || 'unknown';

      if (!['authorized', 'suspended'].includes(instanceState)) {
        throw new Error(STATE_TEXT[instanceState] || `Инстанс вернул состояние: ${instanceState}`);
      }

      onAuthenticated(credentials, remember, instanceState);
    } catch (requestError) {
      setError(requestError?.message || 'Не удалось подключиться к GREEN-API.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-orb auth-orb--one" />
      <div className="auth-orb auth-orb--two" />

      <section className="auth-card">
        <Brand />
        <div className="auth-card__intro">
          <span className="eyebrow">React · GREEN-API · MAX</span>
          <h1>Вход в чат</h1>
          <p>Введите параметры инстанса GREEN-API. Учетные данные не встроены в проект и передаются только напрямую в GREEN-API при подключении.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>idInstance</span>
            <input
              value={idInstance}
              onChange={(event) => setIdInstance(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="3100000000"
              disabled={busy}
            />
          </label>

          <label className="field">
            <span>apiTokenInstance</span>
            <input
              value={apiTokenInstance}
              onChange={(event) => setApiTokenInstance(event.target.value)}
              type="password"
              autoComplete="off"
              placeholder="••••••••••••••••••••"
              disabled={busy}
            />
          </label>

          <details className="advanced">
            <summary>Дополнительные параметры</summary>
            <label className="field field--compact">
              <span>apiUrl</span>
              <input
                value={effectiveApiUrl}
                onChange={(event) => {
                  setApiUrlTouched(true);
                  setApiUrl(event.target.value);
                }}
                onBlur={() => {
                  if (!apiUrl.trim()) setApiUrlTouched(false);
                }}
                placeholder="https://3100.api.green-api.com"
                disabled={busy}
              />
              <small>Определяется автоматически по idInstance. При необходимости вставьте apiUrl из личного кабинета.</small>
            </label>
          </details>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              disabled={busy}
            />
            <span>Запомнить токен на этом устройстве</span>
          </label>

          {error ? <div className="form-error" role="alert">{error}</div> : null}

          <button className="primary-button primary-button--wide" type="submit" disabled={busy}>
            {busy ? 'Подключение…' : 'Войти'}
          </button>
        </form>

        <div className="auth-card__note">
          <span className="status-dot status-dot--soft" />
          <span className="auth-card__note-text">
            Для получения сообщений у инстанса должен быть включён <strong>incomingWebhook</strong>, а <strong>webhookUrl</strong> — пустым.
          </span>
        </div>
      </section>
    </main>
  );
}
