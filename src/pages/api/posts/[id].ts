import type { APIRoute } from 'astro';
import { sql } from '../../../lib/db';
import type { Post } from '../../../lib/schema';

export const prerender = false;

function notFound() {
  return new Response(JSON.stringify({ error: 'Publicación no encontrada' }), {
    status: 404, headers: { 'Content-Type': 'application/json' },
  });
}

function formatPost(p: Post) {
  return { ...p, tags: p.tags ? p.tags.split(',').filter(Boolean) : [] };
}

function toTags(raw: unknown): string {
  if (Array.isArray(raw)) return raw.join(',');
  return typeof raw === 'string' ? raw : '';
}

export const GET: APIRoute = async ({ params }) => {
  const [post] = await sql<Post[]>`SELECT * FROM posts WHERE id = ${params.id}`;
  if (!post) return notFound();
  return new Response(JSON.stringify(formatPost(post)), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const [existing] = await sql`SELECT id FROM posts WHERE id = ${params.id}`;
  if (!existing) return notFound();

  const json = await request.json().catch(() => null);
  if (!json) {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date().toISOString();

  await sql`
    UPDATE posts SET
      title            = COALESCE(${json.title            ?? null}, title),
      slug             = COALESCE(${json.slug             ?? null}, slug),
      description      = COALESCE(${json.description      ?? null}, description),
      body             = COALESCE(${json.body             ?? null}, body),
      author           = COALESCE(${json.author           ?? null}, author),
      category         = COALESCE(${json.category         ?? null}, category),
      pub_date         = COALESCE(${json.pubDate          ?? null}, pub_date),
      featured         = COALESCE(${json.featured !== undefined ? Boolean(json.featured) : null}, featured),
      tags             = COALESCE(${json.tags !== undefined ? toTags(json.tags) : null}, tags),
      status           = COALESCE(${json.status           ?? null}, status),
      cover_url        = COALESCE(${json.coverUrl         ?? null}, cover_url),
      cover_alt        = COALESCE(${json.coverAlt         ?? null}, cover_alt),
      meta_title       = COALESCE(${json.metaTitle        ?? null}, meta_title),
      meta_description = COALESCE(${json.metaDescription  ?? null}, meta_description),
      updated_at       = ${now}
    WHERE id = ${params.id}
  `;

  const [updated] = await sql<Post[]>`SELECT * FROM posts WHERE id = ${params.id}`;
  return new Response(JSON.stringify(formatPost(updated)), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const [existing] = await sql`SELECT id FROM posts WHERE id = ${params.id}`;
  if (!existing) return notFound();

  await sql`DELETE FROM posts WHERE id = ${params.id}`;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
