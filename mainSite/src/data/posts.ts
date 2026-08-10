import type { Post } from '../domain/post/post.types'

const author = { name: 'Hayfel', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80' }

export const posts: Post[] = [
  { id: '1', slug: 'volver-a-crear-con-las-manos', title: 'Volver a crear con las manos', excerpt: 'Notas sobre recuperar el ritmo propio, hacer menos ruido y construir cosas que duren.', category: 'Vida lenta', publishedAt: '2026-08-04', readingMinutes: 6, imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=85', imageAlt: 'Escritorio de madera con libreta, café y una planta', author, featured: true },
  { id: '2', slug: 'internet-con-alma', title: 'Un internet con alma todavía es posible', excerpt: 'Pequeñas decisiones para hacer espacios digitales más humanos, personales y memorables.', category: 'Tecnología', publishedAt: '2026-07-28', readingMinutes: 8, imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1000&q=80', imageAlt: 'Estudio creativo luminoso con mesas de trabajo', author },
  { id: '3', slug: 'fotografiar-lo-cotidiano', title: 'Fotografiar lo cotidiano', excerpt: 'La mejor cámara es la que te ayuda a mirar de nuevo aquello que dabas por sentado.', category: 'Fotografía', publishedAt: '2026-07-15', readingMinutes: 5, imageUrl: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1000&q=80', imageAlt: 'Cámara analógica sobre una mesa', author },
  { id: '4', slug: 'disenar-para-la-calma', title: 'Diseñar para la calma', excerpt: 'Interfaces que respetan la atención y dejan espacio para respirar.', category: 'Diseño', publishedAt: '2026-06-30', readingMinutes: 7, imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80', imageAlt: 'Persona leyendo junto a una ventana', author },
]
