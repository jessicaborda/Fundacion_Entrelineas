// Tipos TypeScript que representan las filas de PostgreSQL
// (con la transformación camelCase de postgres.js)

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  description: string;
  body: string;
  author: string;
  category: string;
  pubDate: string;
  featured: boolean;
  tags: string;
  status: 'draft' | 'published';
  coverUrl: string;
  coverAlt: string;
  metaTitle: string;
  metaDescription: string;
  createdAt: Date;
  updatedAt: Date;
}
