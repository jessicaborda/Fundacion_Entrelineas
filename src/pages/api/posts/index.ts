import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { posts } from '../../../lib/schema';
import { like, eq, and } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { Post } from '../../../lib/schema';

export const prerender = false;

function toTags(raw: unknown): string {
  if (Array.isArray(raw)) return raw.join(',');
  return typeof raw === 'string' ? raw : '';
}

function formatPost(p: Post) {
  return { ...p, tags: p.tags ? p.tags.split(',').filter(Boolean) : [] };
}

export const GET: APIRoute = async ({ url }) => {
  const q        = url.searchParams.get('q') ?? '';
  const status   = url.searchParams.get('status') ?? '';
  const category = url.searchParams.get('category') ?? '';
  const featured = url.searchParams.get('featured') ?? '';

  const conditions = [];
  if (q)        conditions.push(like(posts.title, `%${q}%`));
  if (status)   conditions.push(eq(posts.status, status as 'draft' | 'published'));
  if (category) conditions.push(eq(posts.category, category));
  if (featured === 'true') conditions.push(eq(posts.featured, true));

  const result = await db
    .select()
    .from(posts)
    .where(conditions.length ? and(...conditions) : undefined);

  return new Response(
    JSON.stringify({ posts: result.map(formatPost), total: result.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const POST: APIRoute = async ({ request }) => {
  const json = await request.json().catch(() => null);
  if (!json) {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const errors: Record<string, string> = {};
  if (!json.title?.trim())            errors.title       = 'El título es requerido';
  else if (json.title.length > 120)   errors.title       = 'Máximo 120 caracteres';
  if (!json.slug?.trim())             errors.slug        = 'El slug es requerido';
  else if (!/^[a-z0-9-]+$/.test(json.slug)) errors.slug = 'Solo minúsculas, números y guiones';
  if (!json.description?.trim())      errors.description = 'La descripción es requerida';
  else if (json.description.length > 200) errors.description = 'Máximo 200 caracteres';
  if (!json.author?.trim())           errors.author      = 'El autor es requerido';
  if (!json.category)                 errors.category    = 'La categoría es requerida';
  if (!json.pubDate)                  errors.pubDate     = 'La fecha es requerida';

  if (Object.keys(errors).length) {
    return new Response(JSON.stringify({ error: 'Datos inválidos', fields: errors }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, json.slug));
  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Datos inválidos', fields: { slug: 'Ya existe una publicación con este slug' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const now = new Date().toISOString();
  const newPost = {
    id:              randomUUID(),
    title:           json.title.trim(),
    slug:            json.slug.trim(),
    description:     json.description.trim(),
    body:            json.body ?? '',
    author:          json.author.trim(),
    category:        json.category,
    pubDate:         json.pubDate,
    featured:        Boolean(json.featured),
    tags:            toTags(json.tags),
    status:          (json.status ?? 'draft') as 'draft' | 'published',
    coverUrl:        json.coverUrl ?? '',
    coverAlt:        json.coverAlt ?? '',
    metaTitle:       json.metaTitle ?? '',
    metaDescription: json.metaDescription ?? '',
    createdAt:       now,
    updatedAt:       now,
  };

  await db.insert(posts).values(newPost);

  return new Response(JSON.stringify(formatPost(newPost)), {
    status: 201, headers: { 'Content-Type': 'application/json' },
  });
};
