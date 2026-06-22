import type { APIRoute } from 'astro';
import { readGalleryConfig, writeGalleryConfig, triggerGitPush } from '../../../lib/gallery';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const prerender = false;

export const GET: APIRoute = () => {
  try {
    return new Response(JSON.stringify(readGalleryConfig()), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo leer la configuración de galería' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const json = await request.json().catch(() => null);

  if (!json?.images || !Array.isArray(json.images)) {
    return new Response(JSON.stringify({ error: 'Array de imágenes requerido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (json.images.length === 0) {
    return new Response(JSON.stringify({ error: 'La galería debe tener al menos una imagen' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (json.images.length > 8) {
    return new Response(JSON.stringify({ error: 'Máximo 8 imágenes permitidas' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const galeriaPath = path.join(process.cwd(), 'public', 'galeria');
  for (const img of json.images) {
    if (!img.file || !existsSync(path.join(galeriaPath, img.file))) {
      return new Response(JSON.stringify({ error: `Imagen no encontrada: ${img.file}` }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const updatedBy = locals.user?.email ?? 'admin';
  const config = writeGalleryConfig(json.images, updatedBy);

  let deployTriggered = false;
  try {
    deployTriggered = triggerGitPush(
      'update: galería actualizada desde panel admin',
      ['gallery.config.json']
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Error al hacer commit: ${(err as Error).message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, deployTriggered, estimatedMinutes: 3, config }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
