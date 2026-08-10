// Caja tipo ventana de escritorio retro (barra + contenido). Genérica: el
// CSS de cada tema define los colores de ".win"/".bar"/".accent-*".
export function Window({ title, tag, dark, accent, className = '', children, ...props }) {
  const classes = ['win', dark && 'dark', accent && `accent-${accent}`, className].filter(Boolean).join(' ')
  return (
    <div className={classes} {...props}>
      <div className="bar">
        <span className="wdots"><i /><i /><i /></span>
        <span className="wtitle">{title}</span>
        {tag && <span className="wtag">{tag}</span>}
      </div>
      <div className="inner">{children}</div>
    </div>
  )
}
