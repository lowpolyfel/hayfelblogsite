export function Wordmark({ name, suffix = '', className = '' }) {
  return <span className={className}>{name}<em>{suffix}</em></span>
}
