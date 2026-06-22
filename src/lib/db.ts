import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const dbPath = import.meta.env.DATABASE_URL ?? 'entrelineas.db';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    body        TEXT NOT NULL DEFAULT '',
    author      TEXT NOT NULL,
    category    TEXT NOT NULL,
    pub_date    TEXT NOT NULL,
    featured    INTEGER NOT NULL DEFAULT 0,
    tags        TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'draft',
    cover_url   TEXT NOT NULL DEFAULT '',
    cover_alt   TEXT NOT NULL DEFAULT '',
    meta_title  TEXT NOT NULL DEFAULT '',
    meta_desc   TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )
`);

// Seed inicial (solo si la tabla está vacía)
const { n } = sqlite.prepare('SELECT COUNT(*) as n FROM posts').get() as { n: number };
if (n === 0) {
  const now = new Date().toISOString();
  const insert = sqlite.prepare(`
    INSERT INTO posts
      (id, title, slug, description, body, author, category, pub_date, featured, tags,
       status, cover_url, cover_alt, meta_title, meta_desc, created_at, updated_at)
    VALUES
      (@id, @title, @slug, @description, @body, @author, @category, @pub_date, @featured, @tags,
       @status, @cover_url, @cover_alt, @meta_title, @meta_desc, @created_at, @updated_at)
  `);

  const seed = [
    {
      id: 'seed-0001',
      title: 'La lectura como acto político',
      slug: 'la-lectura-como-acto-politico',
      description: 'Pensar la lectura como práctica que transforma no solo al individuo sino al tejido colectivo en que vivimos.',
      body: '<h2>El lector como ciudadano</h2><p>Entendemos por "político" no la actividad de partidos o elecciones, sino algo más primario: la capacidad de tomar posición en el mundo que habitamos.</p><h2>El libro como bien común</h2><p>La lectura no forma ciudadanos porque transmite información cívica, sino porque ejercita la capacidad de habitar mundos diferentes al propio.</p>',
      author: 'Miguel Ángel Palacios Quitián',
      category: 'Ensayo',
      pub_date: '2025-09-15',
      featured: 1,
      tags: 'lectura,democracia,pensamiento crítico',
      status: 'published',
      cover_url: '',
      cover_alt: '',
      meta_title: '',
      meta_desc: '',
      created_at: '2025-09-10T14:32:00Z',
      updated_at: now,
    },
    {
      id: 'seed-0002',
      title: 'Pensar desde Colombia',
      slug: 'pensar-desde-colombia',
      description: 'Una reflexión sobre el pensamiento filosófico latinoamericano y su lugar en el mundo intelectual contemporáneo.',
      body: '<p>Colombia produce pensamiento filosófico situado, enraizado en sus paisajes, sus conflictos y sus posibilidades.</p>',
      author: 'Fundación Entrelíneas',
      category: 'Artículo',
      pub_date: '2025-10-02',
      featured: 0,
      tags: 'filosofía,colombia,pensamiento',
      status: 'published',
      cover_url: '',
      cover_alt: '',
      meta_title: '',
      meta_desc: '',
      created_at: '2025-09-28T10:00:00Z',
      updated_at: now,
    },
    {
      id: 'seed-0003',
      title: 'Pequeños relatos, grandes joyas',
      slug: 'pequenos-relatos-grandes-joyas',
      description: 'Una aproximación al microrrelato latinoamericano: forma breve, contenido intenso.',
      body: '<p>El microrrelato es la forma narrativa más exigente: cada palabra debe justificarse, cada silencio importa.</p>',
      author: 'Fundación Entrelíneas',
      category: 'Artículo',
      pub_date: '2025-08-20',
      featured: 0,
      tags: 'literatura,microrrelato,narrativa',
      status: 'draft',
      cover_url: '',
      cover_alt: '',
      meta_title: '',
      meta_desc: '',
      created_at: '2025-08-15T09:00:00Z',
      updated_at: now,
    },
  ];

  for (const row of seed) insert.run(row);
}
