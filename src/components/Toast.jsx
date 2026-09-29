import { CloseIcon } from './Icons.jsx';

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.type || 'info'}`} role="status">
      <div>
        <strong>{toast.title}</strong>
        {toast.message ? <p>{toast.message}</p> : null}
      </div>
      <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть уведомление">
        <CloseIcon size={16} />
      </button>
    </div>
  );
}
