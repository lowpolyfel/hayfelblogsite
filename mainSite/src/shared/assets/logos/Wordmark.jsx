export function Wordmark({ suffix = '', variant = 'stamp', className = '' }) {
  if (variant === 'boot') {
    return <h3 className={className}>HAYFEL<br />{suffix}</h3>
  }
  return <h1 className={className}>HAYFEL<span>{suffix}</span></h1>
}
