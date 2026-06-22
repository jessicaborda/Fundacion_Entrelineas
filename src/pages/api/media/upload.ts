import type { APIRoute } from 'astro';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const prerender = false;

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 2 * 1024 * 1024;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return new Response(JSON.stringify({ error: 'FormData inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const context = (form.get('context') as string) ?? '';
  if (context !== 'cover') {
    return new Response(JSON.stringify({ error: 'Contexto inválido. Se esperaba "cover".' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = form.get('file') as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: 'Campo file requerido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!ALLOWED.has(file.type)) {
    return new Response(JSON.stringify({ error: 'Formato no permitido. Solo JPG, PNG o WebP.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: 'La imagen supera el tamaño máximo de 2 MB' }), {
      status: 413, headers: { 'Content-Type': 'application/json' },
    });
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const filename = `cover-${randomUUID().slice(0, 8)}.${ext}`;

  const coversDir = path.join(process.cwd(), 'public', 'covers');
  if (!existsSync(coversDir)) mkdirSync(coversDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(path.join(coversDir, filename), buffer);

  const base = import.meta.env.BASE_URL ?? '/';
  const url = `${base}covers/${filename}`;

  return new Response(JSON.stringify({ url, alt: file.name.replace(/\.\w+$/, '') }), {
    status: 201, headers: { 'Content-Type': 'application/json' },
  });
};
