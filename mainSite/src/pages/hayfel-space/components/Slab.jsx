export function Slab({ rotation = 0, clip = 'a', face = 'crim', className = '', delay = 0, children, ...props }) {
  return (
    <div className={`slab c-${clip} f-${face} ${className}`} style={{ '--rot': `${rotation}deg`, animationDelay: `${delay}ms` }} {...props}>
      <div className="edge" />
      <div className="face">{children}</div>
    </div>
  )
}
