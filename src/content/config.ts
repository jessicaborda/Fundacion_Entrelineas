import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    author: z.string(),
    category: z.enum(['Artículo', 'Ensayo', 'Poema', 'Reseña', 'Comentario crítico']),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
