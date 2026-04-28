# Estilos — Fundación Entrelíneas

## Archivos

- `_variables.scss` — tokens de diseño (parcial, importado automáticamente vía Vite `additionalData`)
- `global.scss` — reset CSS y estilos base globales

Los estilos de cada componente viven en su propio archivo `.astro` con `<style lang="scss">`.

## Tokens disponibles

### Colores
```scss
$color-primary: #FBD200;      // Amarillo — botones, highlights, CTA
$color-secondary: #070523;    // Navy oscuro — hero, videos, footer
$color-accent: #300C49;       // Morado — actividades, manifiesto
$color-editorial: #f2f2f2;    // Gris claro — fondos editoriales (WhatWeDo, History, Gallery, Partners, Blog)
$color-text-light: #ffffff;   // Texto sobre fondos oscuros
$color-text-dark: #070523;    // Texto sobre fondos claros
```

### Tipografía (Manual de Marca 2024)
```scss
$font-family: 'Inter', system-ui, sans-serif;   // Cuerpo de texto
$font-family-heading: 'Chillax', sans-serif;    // UI headings y nav
$font-family-serif: 'Amulya', sans-serif;       // Headings editoriales (h1, h2, estadísticas)
```
Fuentes cargadas desde Fontshare en `BaseLayout.astro`: `chillax@400,500,600,700` + `amulya@400,500,600,700`.

### Espaciado
```scss
$spacing-xs: 0.25rem;    // 4px
$spacing-sm: 0.5rem;     // 8px
$spacing-md: 1rem;       // 16px
$spacing-lg: 1.5rem;     // 24px
$spacing-xl: 2rem;       // 32px
$spacing-2xl: 3rem;      // 48px
$spacing-section: 5rem;  // 80px — padding exterior de secciones
```

### Tamaños tipográficos
```scss
$font-size-sm: 0.875rem   $font-size-base: 1rem
$font-size-lg: 1.125rem   $font-size-xl: 1.25rem
$font-size-2xl: 1.5rem    $font-size-3xl: 2rem
$font-size-4xl: 2.5rem    $font-size-5xl: 3.5rem
```
