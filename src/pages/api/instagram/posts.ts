import type { APIRoute } from 'astro';
import { getInstagramPosts } from '../../../lib/instagram';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const limit = Number(url.searchParams.get('limit') ?? '6') || 6;
  const posts = await getInstagramPosts(limit);

  return new Response(JSON.stringify({ posts }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Cache corto en el borde/navegador; el propio módulo ya cachea 30 min en memoria del servidor
      'Cache-Control': 'public, max-age=300',
    },
  });
};
