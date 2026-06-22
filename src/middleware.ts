import { defineMiddleware } from 'astro:middleware';
import { getUserFromRequest } from './lib/auth';
import { ensureInit } from './lib/db';

const PUBLIC_PATHS = new Set(['/admin/login', '/api/auth/login']);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAdmin = pathname.startsWith('/admin/');
  const isApi   = pathname.startsWith('/api/');

  // Páginas públicas: sin DB ni auth
  if (!isAdmin && !isApi) return next();

  // Admin y API: garantizar que las tablas existen
  await ensureInit();

  if (PUBLIC_PATHS.has(pathname)) return next();

  const user = await getUserFromRequest(context.request);

  if (!user) {
    if (isApi) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect(`${import.meta.env.BASE_URL}admin/login`);
  }

  context.locals.user = user;
  return next();
});
