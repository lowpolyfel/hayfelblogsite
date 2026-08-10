import { siteConfig } from '../../shared/config/site'

export function Header() {
  return <header className="header"><div className="container header__inner">
    <a className="brand" href="#inicio" aria-label={`${siteConfig.name}, inicio`}><span>Entre</span> líneas<span className="brand__dot">.</span></a>
    <nav aria-label="Navegación principal"><a href="#historias">Historias</a><a href="#acerca">Acerca de mí</a><a href="#archivo">Archivo</a></nav>
    <a className="header__cta" href="#boletin">Suscríbete <span aria-hidden="true">↗</span></a>
  </div></header>
}
