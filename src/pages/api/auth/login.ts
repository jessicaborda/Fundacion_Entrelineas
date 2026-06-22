import type { APIRoute } from 'astro';
import { compare } from 'bcryptjs';
import { signToken, COOKIE_NAME } from '../../../lib/auth';
import { sql } from '../../../lib/db';
import type { User } from '../../../lib/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const json = await request.json().catch(() => null);

  if (!json?.email || !json?.password) {
    return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const [user] = await sql<User[]>`SELECT * FROM users WHERE email = ${json.email}`;

  const valid = user && await compare(json.password, user.passwordHash);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = await signToken({ id: user.id, email: user.email, name: user.name });

  return new Response(
    JSON.stringify({ user: { id: user.id, email: user.email, name: user.name } }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${8 * 60 * 60}`,
      },
    }
  );
};
