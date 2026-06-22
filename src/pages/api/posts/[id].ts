import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { posts } from '../../../lib/schema';
import { eq } from 'drizzle-orm';
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
  const [post] = await db.select().from(posts).where(eq(posts.id, params.id!));
  if (!post) return notFound();
  return new Response(JSON.stringify(formatPost(post)), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, params.id!));
  if (!existing) return notFound();

  const json = await request.json().catch(() => null);
  if (!json) {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const updates: Partial<typeof posts.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (json.title       !== undefined) updates.title           = json.title;
  if (json.slug        !== undefined) updates.slug            = json.slug;
  if (json.description !== undefined) updates.description     = json.description;
  if (json.body        !== undefined) updates.body            = json.body;
  if (json.author      !== undefined) updates.author          = json.author;
  if (json.category    !== undefined) updates.category        = json.category;
  if (json.pubDate     !== undefined) updates.pubDate         = json.pubDate;
  if (json.featured    !== undefined) updates.featured        = Boolean(json.featured);
  if (json.tags        !== undefined) updates.tags            = toTags(json.tags);
  if (json.status      !== undefined) updates.status          = json.status;
  if (json.coverUrl    !== undefined) updates.coverUrl        = json.coverUrl;
  if (json.coverAlt    !== undefined) updates.coverAlt        = json.coverAlt;
  if (json.metaTitle   !== undefined) updates.metaTitle       = json.metaTitle;
  if (json.metaDescription !== undefined) updates.metaDescription = json.metaDescription;

  await db.update(posts).set(updates).where(eq(posts.id, params.id!));

  const [updated] = await db.select().from(posts).where(eq(posts.id, params.id!));
  return new Response(JSON.stringify(formatPost(updated)), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, params.id!));
  if (!existing) return notFound();

  await db.delete(posts).where(eq(posts.id, params.id!));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
