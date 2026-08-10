export function Window({ title, tag, dark, crimsonBar, goldBar, className = '', children, ...props }) {
  const classes = ['win', dark && 'dark', crimsonBar && 'crimbar', goldBar && 'goldbar', className].filter(Boolean).join(' ')
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
