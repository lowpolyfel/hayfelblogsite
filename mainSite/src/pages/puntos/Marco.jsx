import './puntos.css'

// Marco común del panel de puntos de canal. Los widgets de OBS no lo usan:
// esos van desnudos y transparentes.
export function Marco({ titulo, sub, children, acciones, activa }) {
  return (
    <div className="rp">
      <header className="rp-nav">
        <a className="rp-back" href="/">← hayfel.com</a>
        <span className="rp-navtitle">PUNTOS DE CANAL</span>
      </header>

      {activa && <Migas actual={activa} />}

      <main className="rp-main">
        <div className="rp-cabecera">
          <h1>{titulo}</h1>
          {sub && <p className="rp-nota">{sub}</p>}
        </div>
        {children}
        {acciones && <div className="rp-acciones">{acciones}</div>}
      </main>
    </div>
  )
}

// Las funciones del panel. No son pasos en fila: se puede ir a cualquiera,
// y por eso son pestañas y no migas de pan numeradas.
function Migas({ actual }) {
  const zonas = [
    { id: 'panel', href: '/puntos', texto: 'Recompensas' },
    { id: 'ruleta', href: '/puntos/ruleta', texto: 'Ruleta' },
    { id: 'voz', href: '/puntos/voz', texto: 'Voz' },
  ]
  return (
    <nav className="rp-pestanas">
      {zonas.map((z) => (
        <a key={z.id} href={z.href} className={z.id === actual ? 'act' : ''}>{z.texto}</a>
      ))}
    </nav>
  )
}
