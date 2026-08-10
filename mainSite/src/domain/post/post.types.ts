export type PostCategory = 'Diseño' | 'Tecnología' | 'Vida lenta' | 'Fotografía'

export interface Author {
  name: string
  avatarUrl: string
}

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  category: PostCategory
  publishedAt: string
  readingMinutes: number
  imageUrl: string
  imageAlt: string
  author: Author
  featured?: boolean
}
