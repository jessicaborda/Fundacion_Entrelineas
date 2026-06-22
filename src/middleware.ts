import { defineMiddleware } from 'astro:middleware';
import { getUserFromRequest } from './lib/auth';
import { ensureInit } from './lib/db';

const PUBLIC_PATHS = new Set(['/admin/login', '/api/auth/login']);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const isApi   = pathname.startsWith('/api/');
  const isBlog  = pathname === '/blog' || pathname.startsWith('/blog/');

  // Rutas que necesitan la DB (excluye páginas estáticas como el home)
  if (isAdmin || isApi || isBlog) {
    await ensureInit();
  }

  // Páginas públicas: sin auth
  if (!isAdmin && !isApi) return next();

  if (PUBLIC_PATHS.has(pathname)) return next();

  const user = await getUserFromRequest(context.request);

  if (!user) {
    if (isApi) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/admin/login');
  }

  context.locals.user = user;
  return next();
});
