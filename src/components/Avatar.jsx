import { initials } from '../utils/format.js';

export function Avatar({ name, src, size = 'md' }) {
  return (
    <div className={`avatar avatar--${size}`} title={name || ''}>
      {src ? <img src={src} alt="" /> : <span>{initials(name)}</span>}
    </div>
  );
}
