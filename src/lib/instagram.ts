// Instagram Graph API — feed de publicaciones para la sección "Actividades"
// Requiere una cuenta de Instagram Business/Creator vinculada a una página de
// Facebook, y un System User token (Meta Business Manager) con permiso
// instagram_basic — este tipo de token no expira, así que no hace falta
// refrescarlo. Ver INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID en
// .env.example para el paso a paso de cómo generarlo.

export interface InstagramPost {
  id: string;
  caption: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaUrl: string;
  permalink: string;
  timestamp: string;
}

const GRAPH_API_VERSION = 'v21.0';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — evita agotar el rate limit de Graph API

let cache: { posts: InstagramPost[]; fetchedAt: number } | null = null;
let inFlight: Promise<InstagramPost[]> | null = null;

function env(name: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)[name] ?? process.env[name];
}

async function fetchFromGraphApi(limit: number): Promise<InstagramPost[]> {
  const token = env('INSTAGRAM_ACCESS_TOKEN');
  const businessAccountId = env('INSTAGRAM_BUSINESS_ACCOUNT_ID');

  if (!token || !businessAccountId) {
    throw new Error('Instagram no configurado: falta INSTAGRAM_ACCESS_TOKEN o INSTAGRAM_BUSINESS_ACCOUNT_ID');
  }

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${businessAccountId}/media` +
    `?fields=${fields}&limit=${limit}&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Graph API respondió ${res.status}: ${body}`);
  }

  const json = await res.json() as { data: any[] };

  return json.data.map((item) => ({
    id: item.id,
    caption: item.caption ?? '',
    mediaType: item.media_type,
    // Los videos y carruseles no siempre exponen media_url reproducible; thumbnail_url es más confiable para preview
    mediaUrl: item.thumbnail_url ?? item.media_url,
    permalink: item.permalink,
    timestamp: item.timestamp,
  }));
}

/**
 * Devuelve las últimas publicaciones de Instagram, cacheadas en memoria
 * por CACHE_TTL_MS. Si la llamada a la Graph API falla (token vencido,
 * no configurado, rate limit), devuelve el cache anterior si existe,
 * o un array vacío — nunca rompe el render de la sección.
 */
export async function getInstagramPosts(limit = 6): Promise<InstagramPost[]> {
  const isFresh = cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh) return cache!.posts;

  if (!inFlight) {
    inFlight = fetchFromGraphApi(limit)
      .then((posts) => {
        cache = { posts, fetchedAt: Date.now() };
        return posts;
      })
      .catch((err) => {
        console.error('[instagram]', err.message);
        return cache?.posts ?? [];
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}
