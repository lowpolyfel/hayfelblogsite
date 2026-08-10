import { Header } from '../../components/layout/Header'
import { Footer } from '../../components/layout/Footer'
import { PostCard } from '../../features/posts/components/PostCard'
import { NewsletterForm } from '../../features/newsletter/NewsletterForm'
import { posts } from '../../data/posts'
import { formatPublishedDate } from '../../shared/lib/date'
import './blog-home.css'

export function BlogHomePage() {
  const featured = posts.find(post => post.featured) ?? posts[0]
  return <><a className="skip-link" href="#contenido">Saltar al contenido</a><Header /><main id="contenido">
    <section className="hero" id="inicio"><div className="container"><p className="hero__kicker">Un blog personal sobre las cosas que importan</p><h1>Ideas para vivir y crear<br /><em>con más intención.</em></h1><p className="hero__intro">Historias, aprendizajes y hallazgos en la intersección entre creatividad, tecnología y una vida más consciente.</p><div className="hero__scroll" aria-hidden="true">Explora las historias <span>↓</span></div></div></section>
    <section className="featured container" aria-labelledby="destacada"><a href={`/blog/${featured.slug}`}><div className="featured__image"><img src={featured.imageUrl} alt={featured.imageAlt} /></div><div className="featured__content"><span className="eyebrow">Historia destacada · {featured.category}</span><h2 id="destacada">{featured.title}</h2><p>{featured.excerpt}</p><div className="post-meta"><span>{formatPublishedDate(featured.publishedAt)}</span><span>{featured.readingMinutes} min de lectura</span></div><span className="read-more">Leer la historia <b aria-hidden="true">→</b></span></div></a></section>
    <section className="stories container" id="historias" aria-labelledby="ultimas"><div className="section-heading"><div><span className="eyebrow">Cuaderno de notas</span><h2 id="ultimas">Últimas historias</h2></div><a href="#archivo">Ver todo el archivo →</a></div><div className="post-grid">{posts.filter(post => !post.featured).map(post => <PostCard key={post.id} post={post} />)}</div></section>
    <section className="about" id="acerca"><div className="container about__inner"><div className="about__mark" aria-hidden="true">H</div><div><span className="eyebrow">Hola, soy Hayfel</span><h2>Escribo para entender mejor el mundo.</h2><p>Este es mi rincón en internet: un lugar sin algoritmos donde comparto lo que aprendo, las imágenes que me detienen y las preguntas que todavía no sé responder.</p><a href="/acerca">Conoce mi historia →</a></div></div></section>
    <section className="newsletter container" id="boletin"><div><span className="eyebrow">Cartas sin prisa</span><h2>Una buena historia,<br />directo a tu bandeja.</h2></div><div><p>Una carta ocasional con nuevas ideas, enlaces favoritos y pequeñas cosas que vale la pena compartir. Sin ruido. Sin spam.</p><NewsletterForm /></div></section>
  </main><Footer /></>
}
