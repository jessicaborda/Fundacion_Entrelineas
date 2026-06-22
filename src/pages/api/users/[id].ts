import type { APIRoute } from 'astro';
import { hash } from 'bcryptjs';
import { sql } from '../../../lib/db';

export const prerender = false;

function notFound() {
  return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
    status: 404, headers: { 'Content-Type': 'application/json' },
  });
}

export const PUT: APIRoute = async ({ params, request }) => {
  const [existing] = await sql`SELECT id FROM users WHERE id = ${params.id}`;
  if (!existing) return notFound();

  const json = await request.json().catch(() => null);
  if (!json) {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (json.password !== undefined && json.password.length < 8) {
    return new Response(
      JSON.stringify({ error: 'Datos inválidos', fields: { password: 'Mínimo 8 caracteres' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const passwordHash = json.password ? await hash(json.password, 12) : null;

  await sql`
    UPDATE users SET
      name          = COALESCE(${json.name ?? null}, name),
      password_hash = COALESCE(${passwordHash}, password_hash)
    WHERE id = ${params.id}
  `;

  const [updated] = await sql`SELECT id, email, name, created_at FROM users WHERE id = ${params.id}`;
  return new Response(JSON.stringify(updated), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (params.id === locals.user?.id) {
    return new Response(JSON.stringify({ error: 'No puedes eliminar tu propio usuario' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const [existing] = await sql`SELECT id FROM users WHERE id = ${params.id}`;
  if (!existing) return notFound();

  await sql`DELETE FROM users WHERE id = ${params.id}`;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
