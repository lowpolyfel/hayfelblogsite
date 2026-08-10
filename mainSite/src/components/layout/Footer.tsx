import { siteConfig } from '../../shared/config/site'

export function Footer() {
  return <footer className="footer"><div className="container footer__inner"><div><strong>{siteConfig.name}.</strong><p>{siteConfig.description}</p></div><div className="footer__links">{siteConfig.social.map(item => <a key={item.label} href={item.href} target="_blank" rel="noreferrer">{item.label}</a>)}</div><small>© 2026 Hecho despacio y con intención.</small></div></footer>
}
