import postgres from 'postgres';
import type { Sql } from 'postgres';
import { hash } from 'bcryptjs';

let _sql: Sql | null = null;

function connection(): Sql {
  if (!_sql) {
    const url = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL no configurado');
    _sql = postgres(url, { transform: postgres.camel, max: 10, idle_timeout: 20 });
  }
  return _sql;
}

// Proxy lazy: la conexión se crea solo cuando se usa sql por primera vez
export const sql = new Proxy(
  function () {} as unknown as Sql,
  {
    apply(_t, _this, args) { return (connection() as any)(...args); },
    get(_t, prop) {
      if (prop === 'then') return undefined; // evitar confusión con Promise
      const conn = connection();
      const val = (conn as any)[prop];
      return typeof val === 'function' ? val.bind(conn) : val;
    },
  }
) as Sql;

let initPromise: Promise<void> | null = null;
export function ensureInit(): Promise<void> {
  if (!initPromise) initPromise = _init();
  return initPromise;
}

async function _init() {
  const db = connection();

  await db`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT        NOT NULL UNIQUE,
      name          TEXT        NOT NULL,
      password_hash TEXT        NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS posts (
      id               UUID    PRIMARY KEY,
      title            TEXT    NOT NULL,
      slug             TEXT    NOT NULL UNIQUE,
      description      TEXT    NOT NULL,
      body             TEXT    NOT NULL DEFAULT '',
      author           TEXT    NOT NULL,
      category         TEXT    NOT NULL,
      pub_date         TEXT    NOT NULL,
      featured         BOOLEAN NOT NULL DEFAULT false,
      tags             TEXT    NOT NULL DEFAULT '',
      status           TEXT    NOT NULL DEFAULT 'draft',
      cover_url        TEXT    NOT NULL DEFAULT '',
      cover_alt        TEXT    NOT NULL DEFAULT '',
      meta_title       TEXT    NOT NULL DEFAULT '',
      meta_description TEXT    NOT NULL DEFAULT '',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const seedEmail    = import.meta.env.SEED_ADMIN_EMAIL    ?? process.env.SEED_ADMIN_EMAIL;
  const seedPassword = import.meta.env.SEED_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;
  const seedName     = import.meta.env.SEED_ADMIN_NAME     ?? process.env.SEED_ADMIN_NAME ?? 'Admin';

  if (seedEmail && seedPassword) {
    const [{ count }] = await db<[{ count: number }]>`SELECT COUNT(*)::int AS count FROM users`;
    if (count === 0) {
      const passwordHash = await hash(seedPassword, 12);
      await db`
        INSERT INTO users (email, name, password_hash)
        VALUES (${seedEmail}, ${seedName}, ${passwordHash})
        ON CONFLICT DO NOTHING
      `;
      console.log(`[db] Admin creado: ${seedEmail}`);
    }
  }
}
