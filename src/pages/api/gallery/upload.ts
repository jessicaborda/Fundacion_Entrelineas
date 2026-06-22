import type { APIRoute } from 'astro';
import { writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

export const prerender = false;

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 5 * 1024 * 1024;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return new Response(JSON.stringify({ error: 'FormData inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = form.get('image') as File | null;
  const alt  = (form.get('alt') as string) ?? '';

  if (!file) {
    return new Response(JSON.stringify({ error: 'Campo image requerido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!ALLOWED.has(file.type)) {
    return new Response(JSON.stringify({ error: 'Formato no permitido. Solo JPG, PNG o WebP.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: 'La imagen supera el tamaño máximo de 5 MB' }), {
      status: 413, headers: { 'Content-Type': 'application/json' },
    });
  }

  const galeriaPath = path.join(process.cwd(), 'public', 'galeria');
  const existing = readdirSync(galeriaPath).filter(f => /^img_\d+\.(jpg|png|webp)$/i.test(f));
  const maxN = existing.reduce((max, f) => {
    const n = parseInt(f.replace(/^img_/, '').replace(/\.\w+$/, ''), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);

  const filename = `img_${String(maxN + 1).padStart(2, '0')}.jpg`;
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(path.join(galeriaPath, filename), buffer);

  const base = import.meta.env.BASE_URL ?? '/';
  return new Response(
    JSON.stringify({ file: filename, url: `${base}galeria/${filename}`, alt }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};
