import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const posts = sqliteTable('posts', {
  id:              text('id').primaryKey(),
  title:           text('title').notNull(),
  slug:            text('slug').notNull().unique(),
  description:     text('description').notNull(),
  body:            text('body').notNull().default(''),
  author:          text('author').notNull(),
  category:        text('category').notNull(),
  pubDate:         text('pub_date').notNull(),
  featured:        integer('featured', { mode: 'boolean' }).notNull().default(false),
  tags:            text('tags').notNull().default(''),
  status:          text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  coverUrl:        text('cover_url').notNull().default(''),
  coverAlt:        text('cover_alt').notNull().default(''),
  metaTitle:       text('meta_title').notNull().default(''),
  metaDescription: text('meta_desc').notNull().default(''),
  createdAt:       text('created_at').notNull(),
  updatedAt:       text('updated_at').notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
