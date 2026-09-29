export function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="MAX Bridge">
      <span className="brand__mark" aria-hidden="true"><span /></span>
      {!compact && (
        <span className="brand__text">
          <strong>MAX</strong>
          <small>Bridge</small>
        </span>
      )}
    </div>
  );
}
