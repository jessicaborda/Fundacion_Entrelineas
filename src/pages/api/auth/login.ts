import type { APIRoute } from 'astro';
import { signToken, verifyPassword, COOKIE_NAME } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const json = await request.json().catch(() => null);

  if (!json?.email || !json?.password) {
    return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminEmail = import.meta.env.ADMIN_EMAIL;
  const adminHash = import.meta.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    return new Response(JSON.stringify({ error: 'Servidor no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const emailMatch = json.email === adminEmail;
  const passwordMatch = emailMatch && await verifyPassword(json.password, adminHash);

  if (!emailMatch || !passwordMatch) {
    return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = await signToken({ id: 'admin', email: adminEmail, name: 'Administrador' });

  return new Response(
    JSON.stringify({ user: { id: 'admin', name: 'Administrador', email: adminEmail }, token }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${8 * 60 * 60}`,
      },
    }
  );
};
