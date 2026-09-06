import './ruleta-panel.css'

// Marco común de las tres páginas del panel (entrar, panel y ajustes).
// El widget de OBS no lo usa: ese va desnudo y transparente.
export function Marco({ paso, titulo, children, acciones }) {
  return (
    <div className="rp">
      <header className="rp-nav">
        <a className="rp-back" href="/">← hayfel.com</a>
        <span className="rp-navtitle">RULETA</span>
      </header>

      <main className="rp-main">
        <div className="rp-cabecera">
          {paso && <span className="rp-paso">{paso}</span>}
          <h1>{titulo}</h1>
        </div>
        {children}
        {acciones && <div className="rp-acciones">{acciones}</div>}
      </main>
    </div>
  )
}

// Las tres páginas van en fila: sirve para saber dónde estás y para volver
// atrás sin usar el botón del navegador.
export function Migas({ actual }) {
  const pasos = [
    { id: 'entrar', href: '/ruleta/entrar', texto: 'Entrar' },
    { id: 'panel', href: '/ruleta/panel', texto: 'Recompensa' },
    { id: 'ajustes', href: '/ruleta/ajustes', texto: 'Ruleta' },
  ]
  return (
    <nav className="rp-migas">
      {pasos.map((p, i) => (
        <span key={p.id} className={p.id === actual ? 'act' : ''}>
          {i > 0 && <i aria-hidden="true">›</i>}
          <a href={p.href}>{p.texto}</a>
        </span>
      ))}
    </nav>
  )
}
