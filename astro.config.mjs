// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://jessicaborda.github.io',
  base: '/Fundacion_Entrelineas/',
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/styles/_variables.scss";`
        }
      }
    }
  }
});
