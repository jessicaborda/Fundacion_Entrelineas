import type { APIRoute } from 'astro';
import { hash } from 'bcryptjs';
import { sql } from '../../../lib/db';
import type { User } from '../../../lib/schema';

export const prerender = false;

export const GET: APIRoute = async () => {
  const users = await sql<Omit<User, 'passwordHash'>[]>`
    SELECT id, email, name, created_at FROM users ORDER BY created_at ASC
  `;
  return new Response(JSON.stringify({ users }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const json = await request.json().catch(() => null);
  if (!json) {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const errors: Record<string, string> = {};
  if (!json.email?.trim())    errors.email    = 'El email es requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(json.email)) errors.email = 'Email inválido';
  if (!json.name?.trim())     errors.name     = 'El nombre es requerido';
  if (!json.password?.trim()) errors.password = 'La contraseña es requerida';
  else if (json.password.length < 8) errors.password = 'Mínimo 8 caracteres';

  if (Object.keys(errors).length) {
    return new Response(JSON.stringify({ error: 'Datos inválidos', fields: errors }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const [existing] = await sql`SELECT id FROM users WHERE email = ${json.email.trim()}`;
  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Datos inválidos', fields: { email: 'Ya existe un usuario con este email' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const passwordHash = await hash(json.password, 12);
  const [created] = await sql<Pick<User, 'id' | 'email' | 'name' | 'createdAt'>[]>`
    INSERT INTO users (email, name, password_hash)
    VALUES (${json.email.trim()}, ${json.name.trim()}, ${passwordHash})
    RETURNING id, email, name, created_at
  `;

  return new Response(JSON.stringify(created), {
    status: 201, headers: { 'Content-Type': 'application/json' },
  });
};
