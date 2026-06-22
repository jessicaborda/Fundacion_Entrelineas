import type { APIRoute } from 'astro';
import { sql } from '../../../lib/db';
import type { Post } from '../../../lib/schema';
import { randomUUID } from 'node:crypto';

export const prerender = false;

function formatPost(p: Post) {
  return { ...p, tags: p.tags ? p.tags.split(',').filter(Boolean) : [] };
}

function toTags(raw: unknown): string {
  if (Array.isArray(raw)) return raw.join(',');
  return typeof raw === 'string' ? raw : '';
}

export const GET: APIRoute = async ({ url }) => {
  const q        = url.searchParams.get('q') ?? '';
  const status   = url.searchParams.get('status') ?? '';
  const category = url.searchParams.get('category') ?? '';
  const featured = url.searchParams.get('featured') ?? '';

  const filters: ReturnType<typeof sql>[] = [];
  if (q)                  filters.push(sql`title ILIKE ${'%' + q + '%'}`);
  if (status)             filters.push(sql`status = ${status}`);
  if (category)           filters.push(sql`category = ${category}`);
  if (featured === 'true') filters.push(sql`featured = true`);

  const where = filters.length
    ? sql`WHERE ${sql.join(filters, sql` AND `)}`
    : sql``;

  const rows = await sql<Post[]>`SELECT * FROM posts ${where} ORDER BY created_at DESC`;

  return new Response(
    JSON.stringify({ posts: rows.map(formatPost), total: rows.length }),
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
  if (!json.title?.trim())                   errors.title       = 'El título es requerido';
  else if (json.title.length > 120)          errors.title       = 'Máximo 120 caracteres';
  if (!json.slug?.trim())                    errors.slug        = 'El slug es requerido';
  else if (!/^[a-z0-9-]+$/.test(json.slug)) errors.slug        = 'Solo minúsculas, números y guiones';
  if (!json.description?.trim())             errors.description = 'La descripción es requerida';
  else if (json.description.length > 200)    errors.description = 'Máximo 200 caracteres';
  if (!json.author?.trim())                  errors.author      = 'El autor es requerido';
  if (!json.category)                        errors.category    = 'La categoría es requerida';
  if (!json.pubDate)                         errors.pubDate     = 'La fecha es requerida';

  if (Object.keys(errors).length) {
    return new Response(JSON.stringify({ error: 'Datos inválidos', fields: errors }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const [existing] = await sql`SELECT id FROM posts WHERE slug = ${json.slug}`;
  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Datos inválidos', fields: { slug: 'Ya existe una publicación con este slug' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const id  = randomUUID();
  const now = new Date().toISOString();
  const tags = toTags(json.tags);
  const status = (json.status ?? 'draft') as string;

  await sql`
    INSERT INTO posts
      (id, title, slug, description, body, author, category, pub_date,
       featured, tags, status, cover_url, cover_alt, meta_title, meta_description,
       created_at, updated_at)
    VALUES
      (${id}, ${json.title.trim()}, ${json.slug.trim()}, ${json.description.trim()},
       ${json.body ?? ''}, ${json.author.trim()}, ${json.category}, ${json.pubDate},
       ${Boolean(json.featured)}, ${tags}, ${status},
       ${json.coverUrl ?? ''}, ${json.coverAlt ?? ''}, ${json.metaTitle ?? ''}, ${json.metaDescription ?? ''},
       ${now}, ${now})
  `;

  const [created] = await sql<Post[]>`SELECT * FROM posts WHERE id = ${id}`;
  return new Response(JSON.stringify(formatPost(created)), {
    status: 201, headers: { 'Content-Type': 'application/json' },
  });
};
