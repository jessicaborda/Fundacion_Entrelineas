import type { APIRoute } from 'astro';
import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { readGalleryConfig, triggerGitPush } from '../../../../lib/gallery';

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

  const imagePath = path.join(process.cwd(), 'public', 'galeria', filename);
  if (!existsSync(imagePath)) {
    return new Response(JSON.stringify({ error: 'Imagen no encontrada' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  unlinkSync(imagePath);

  let deployTriggered = false;
  try {
    deployTriggered = triggerGitPush(
      `remove: imagen ${filename} eliminada desde panel admin`,
      [path.join('public', 'galeria', filename)]
    );
  } catch {
    // La imagen se eliminó localmente; el push puede reintentarse manualmente
  }

  return new Response(JSON.stringify({ ok: true, deployTriggered }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
