import type { APIRoute } from 'astro';
import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { readGalleryConfig, getGaleriaDir } from '../../../../lib/gallery';

export const prerender = false;

export const DELETE: APIRoute = ({ params }) => {
  const { filename } = params;
  if (!filename || !/^[\w.-]+$/.test(filename)) {
    return new Response(JSON.stringify({ error: 'Nombre de archivo inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const config = readGalleryConfig();
  if (config.images.some(img => img.file === filename)) {
    return new Response(
      JSON.stringify({ error: 'La imagen está activa en la galería. Quítala primero.' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const imagePath = path.join(getGaleriaDir(), filename);
  if (!existsSync(imagePath)) {
    return new Response(JSON.stringify({ error: 'Imagen no encontrada' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  unlinkSync(imagePath);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
