# Servidor y despliegue

## Hosting

El proyecto está desplegado en **Dockploy**, usando el `Dockerfile` y el `docker-compose.yml` del repositorio (Postgres + app Astro con SSR vía `@astrojs/node`).

## Producción

- **URL de producción:** https://www.fundacionentrelineas.com/
- **Scope:** existe un único entorno (no hay staging/preview). Todo lo que llega a `main` es lo que corre en producción.

## Flujo de deploy

Dockploy está conectado al repositorio de GitHub. **Cada push a `main` dispara un build y deploy automático** — no hay pasos manuales ni GitHub Actions involucrados en el deploy (el workflow de GitHub Pages que existía antes fue eliminado por quedar obsoleto).

Esto implica:

- No hacer push a `main` con cambios a medio terminar; `main` es directamente producción.
- No hace falta (ni existe) un paso de "promover" un build a producción: build exitoso en Dockploy = queda publicado.
- Las variables de entorno (`DATABASE_URL`, `AUTH_SECRET`, `SEED_ADMIN_*`, etc., ver `docker-compose.yml` y `.env.example`) se gestionan directamente en la configuración del servicio en Dockploy, no en el repo.
