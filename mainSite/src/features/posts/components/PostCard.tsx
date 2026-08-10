import type { Post } from '../../../domain/post/post.types'
import { formatPublishedDate } from '../../../shared/lib/date'

export function PostCard({ post }: { post: Post }) {
  return <article className="post-card"><a href={`/blog/${post.slug}`} aria-label={`Leer ${post.title}`}><div className="post-card__image"><img src={post.imageUrl} alt={post.imageAlt} loading="lazy" /></div><div className="post-card__body"><span className="eyebrow">{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p><div className="post-meta"><span>{formatPublishedDate(post.publishedAt)}</span><span>{post.readingMinutes} min de lectura</span></div></div></a></article>
}
