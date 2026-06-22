// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://jessicaborda.github.io',
  base: '/Fundacion_Entrelineas/',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  vite: {
    ssr: {
      external: ['better-sqlite3'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "src/styles/_variables.scss" as *;`
        }
      }
    }
  }
});
