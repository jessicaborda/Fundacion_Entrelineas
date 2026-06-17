# Contrato de Backend — Panel Admin Fundación Entrelíneas

> **Propósito:** Especificación funcional para el equipo o agente backend encargado de implementar los servicios que conectan el panel de administración (`/admin/*`) con persistencia real de datos. La UI del panel ya está construida y es funcional a nivel visual; este documento define el contrato que debe cumplir el backend para que todo funcione de extremo a extremo.

---

## 1. Contexto del sistema

| Elemento | Detalle |
|---|---|
| Frontend | Astro (actualmente estático / GitHub Pages) |
| Migración prevista | Dominio propio con hosting que soporte SSR o funciones serverless |
| Panel admin | `/admin/` — UI construida, sin conexión a datos reales |
| Autenticación | Ninguna implementada aún — **requerida antes de producción** |

---

## 2. Autenticación

El panel admin **debe estar protegido**. Toda ruta bajo `/admin/*` y todo endpoint bajo `/api/*` requiere sesión activa.

### Endpoints requeridos

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### `POST /api/auth/login`

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Respuesta 200:**
```json
{
  "user": { "id": "string", "name": "string", "email": "string" },
  "token": "string"
}
```

**Respuesta 401:**
```json
{ "error": "Credenciales inválidas" }
```

### Comportamiento esperado

- Sesión mediante cookie `HttpOnly` o token Bearer en header `Authorization`
- Si el usuario accede a `/admin/*` sin sesión → redirigir a `/admin/login`
- Token con expiración de 8 horas (renovable por actividad)
- Un solo rol inicial: `admin`

---

## 3. Módulo Blog — Publicaciones

La página `/admin/index.astro` lista publicaciones, permite buscar, editar y eliminar.  
Las páginas `/admin/new.astro` y `/admin/edit/[id].astro` gestionan creación y edición.

### Modelo `Post`

```typescript
interface Post {
  id:              string;          // UUID o slug único
  title:           string;          // máx. 120 caracteres — requerido
  slug:            string;          // URL-friendly, único — requerido
  description:     string;          // máx. 200 caracteres — requerido
  body:            string;          // HTML generado por editor Quill
  author:          string;          // requerido
  category:        PostCategory;    // requerido — ver enum abajo
  pubDate:         string;          // ISO 8601 "YYYY-MM-DD"
  featured:        boolean;         // aparece destacada en portada
  tags:            string[];        // opcional
  status:          'draft' | 'published';
  coverUrl:        string;          // URL absoluta de imagen de portada (opcional)
  coverAlt:        string;          // texto alt de la imagen (opcional)
  metaTitle:       string;          // máx. 60 caracteres — override SEO (opcional)
  metaDescription: string;          // máx. 155 caracteres — override SEO (opcional)
  createdAt:       string;          // ISO 8601 — asignado por el servidor
  updatedAt:       string;          // ISO 8601 — actualizado automáticamente
}

type PostCategory = 'Artículo' | 'Ensayo' | 'Poema' | 'Reseña' | 'Comentario crítico';
```

### Endpoints requeridos

```
GET    /api/posts
GET    /api/posts/:id
POST   /api/posts
PUT    /api/posts/:id
DELETE /api/posts/:id
```

---

#### `GET /api/posts`

Lista todas las publicaciones. Soporta filtrado y búsqueda desde el panel.

**Query params opcionales:**
| Param | Tipo | Descripción |
|---|---|---|
| `q` | string | Búsqueda por título (insensible a mayúsculas) |
| `status` | `draft \| published` | Filtrar por estado |
| `category` | string | Filtrar por categoría |
| `featured` | boolean | Solo destacadas |

**Respuesta 200:**
```json
{
  "posts": [ /* Post[] */ ],
  "total": 12
}
```

---

#### `GET /api/posts/:id`

Devuelve un post por ID para pre-poblar el formulario de edición.

**Respuesta 200:** `Post` completo  
**Respuesta 404:** `{ "error": "Publicación no encontrada" }`

---

#### `POST /api/posts`

Crea una nueva publicación.

**Body:** `Omit<Post, 'id' | 'createdAt' | 'updatedAt'>`

**Validaciones requeridas:**
- `title` — requerido, máx. 120 caracteres
- `slug` — requerido, único, solo minúsculas, números y guiones (`/^[a-z0-9-]+$/`)
- `description` — requerido, máx. 200 caracteres
- `body` — requerido, no puede ser HTML vacío
- `author` — requerido
- `category` — requerido, valor dentro del enum
- `pubDate` — requerido, formato `YYYY-MM-DD`

**Respuesta 201:** `Post` creado completo  
**Respuesta 400:**
```json
{
  "error": "Datos inválidos",
  "fields": { "slug": "Ya existe una publicación con este slug" }
}
```

---

#### `PUT /api/posts/:id`

Actualiza una publicación existente. Acepta actualización parcial (todos los campos son opcionales).

**Body:** `Partial<Post>` (sin `id`, `createdAt`)  
**Respuesta 200:** `Post` actualizado completo  
**Respuesta 404:** `{ "error": "Publicación no encontrada" }`

---

#### `DELETE /api/posts/:id`

Elimina una publicación permanentemente.

**Respuesta 200:** `{ "ok": true }`  
**Respuesta 404:** `{ "error": "Publicación no encontrada" }`

---

### Autoguardado (autosave)

El editor llama a `PUT /api/posts/:id` automáticamente cada 30 segundos cuando hay cambios sin guardar. El backend debe actualizar `updatedAt` en cada llamada.

El indicador visual en el topbar del editor muestra tres estados:
- `"Sin cambios"` — sin ediciones desde el último guardado
- `"Guardando…"` — petición en curso
- `"Guardado"` — confirmación de 200 OK

---

## 4. Módulo Galería

### Arquitectura — Opción A: escritura directa + rebuild automático

La galería funciona con un ciclo completo sin intervención manual de código:

```
Admin guarda cambios
       │
       ▼
PUT /api/gallery
       │
       ▼
Backend escribe gallery.config.json en el repo
       │
       ▼
git commit + git push → rama main
       │
       ▼
GitHub Actions detecta el push → ejecuta deploy
       │
       ▼
Astro build lee gallery.config.json → genera HTML
       │
       ▼
Cambios visibles en el sitio (~2–3 minutos)
```

**Implicación para el frontend:** `Gallery.astro` debe dejar de tener las imágenes hardcodeadas y leer desde `gallery.config.json` en tiempo de build. Ver sección 4.1.

---

### 4.1 Archivo de configuración — fuente de verdad

El backend mantiene el archivo `gallery.config.json` en la raíz del repositorio. Este archivo es la única fuente de verdad para la selección y orden de imágenes de la galería.

**Formato:**
```json
{
  "images": [
    { "file": "img_01.jpg", "alt": "Tertulia literaria Entrelíneas" },
    { "file": "img_05.jpg", "alt": "Encuentro cultural Entrelíneas" },
    { "file": "img_07.jpg", "alt": "Actividad Entrelíneas" },
    { "file": "img_13.jpg", "alt": "Festival de lectura" },
    { "file": "img_15.jpg", "alt": "Café filosófico" },
    { "file": "img_17.jpg", "alt": "Taller de escritura" },
    { "file": "img_19.jpg", "alt": "Promotores de lectura" },
    { "file": "img_23.jpg", "alt": "Comunidad lectora Entrelíneas" }
  ],
  "updatedAt": "2026-06-17T14:30:00Z",
  "updatedBy": "admin"
}
```

**`Gallery.astro` debe actualizarse** para leer este archivo en el frontmatter:

```typescript
// En Gallery.astro — reemplazar el array hardcodeado por:
import galleryConfig from '../../../gallery.config.json';
const images = galleryConfig.images;
```

---

### Modelo `GalleryConfig`

```typescript
interface GalleryImage {
  file:      string;   // nombre del archivo, ej. "img_01.jpg"
  alt:       string;   // texto alternativo
}

interface GalleryConfig {
  images:    GalleryImage[];   // ordenadas — máx. 8 — la primera es la imagen destacada
  updatedAt: string;           // ISO 8601 UTC
  updatedBy: string;           // identificador del usuario admin
}
```

### Endpoints requeridos

```
GET    /api/gallery
PUT    /api/gallery
GET    /api/gallery/deploy-status
POST   /api/gallery/upload
DELETE /api/gallery/images/:filename
```

---

#### `GET /api/gallery`

Devuelve la configuración activa leyendo directamente `gallery.config.json`.

**Respuesta 200:** `GalleryConfig`

---

#### `PUT /api/gallery`

Actualiza la selección y orden de imágenes. Es el endpoint central de este módulo — realiza tres operaciones en secuencia: validar → escribir JSON → disparar rebuild.

**Body:**
```json
{
  "images": [
    { "file": "img_01.jpg", "alt": "Tertulia literaria Entrelíneas" },
    { "file": "img_05.jpg", "alt": "Encuentro cultural Entrelíneas" }
  ]
}
```

**Validaciones:**
- Máximo 8 imágenes
- Array no puede estar vacío
- Cada `file` debe existir en `/public/galeria/`

**Flujo interno del backend:**
1. Validar body
2. Escribir `gallery.config.json` con los nuevos datos + `updatedAt` + `updatedBy`
3. Ejecutar:
   ```bash
   git add gallery.config.json
   git commit -m "update: galería actualizada desde panel admin"
   git push origin main
   ```
4. Devolver respuesta inmediatamente — no esperar a que termine el deploy

**Respuesta 200:**
```json
{
  "ok": true,
  "deployTriggered": true,
  "estimatedMinutes": 3,
  "config": { /* GalleryConfig actualizada */ }
}
```

**Respuesta 400:** `{ "error": "Máximo 8 imágenes permitidas" }`  
**Respuesta 500:** `{ "error": "Error al hacer commit. Revisa las credenciales de git." }`

**Comportamiento esperado en el panel admin:**
- Al hacer clic en "Guardar galería" → estado `"Guardando y publicando…"`
- Al recibir 200 → estado `"¡Listo! Los cambios se verán en ~3 minutos"`
- El panel puede consultar `/api/gallery/deploy-status` para confirmar cuando el deploy terminó

---

#### `GET /api/gallery/deploy-status`

Permite al panel consultar el estado del último deploy disparado por un cambio en la galería.

**Respuesta 200:**
```json
{
  "status": "pending" | "running" | "success" | "failure",
  "startedAt": "2026-06-17T14:30:05Z",
  "finishedAt": "2026-06-17T14:32:48Z" | null,
  "url": "https://github.com/org/repo/actions/runs/123456789"
}
```

**Implementación sugerida:** consultar la GitHub Actions API con un token de lectura para obtener el estado del workflow más reciente sobre `main`.

---

#### `POST /api/gallery/upload`

Sube una nueva imagen a `/public/galeria/` del repositorio y la incluye en el commit del siguiente guardado.

**Body:** `multipart/form-data`
| Campo | Tipo | Descripción |
|---|---|---|
| `image` | File | JPG, PNG o WebP — máx. 5 MB |
| `alt` | string | Texto alternativo |

**Validaciones:**
- Formatos permitidos: `image/jpeg`, `image/png`, `image/webp`
- Tamaño máximo: 5 MB
- Nombre de archivo: normalizar a `img_NN.jpg` siguiendo la secuencia existente, sin espacios ni caracteres especiales

**Flujo interno:**
1. Guardar el archivo en `/public/galeria/`
2. **No** disparar rebuild aquí — la imagen se incluirá en el próximo `PUT /api/gallery`

**Respuesta 201:**
```json
{
  "file": "img_25.jpg",
  "url": "/Fundacion_Entrelineas/galeria/img_25.jpg",
  "alt": "texto alt"
}
```

**Respuesta 400:** `{ "error": "Formato no permitido" }`  
**Respuesta 413:** `{ "error": "La imagen supera el tamaño máximo de 5 MB" }`

---

#### `DELETE /api/gallery/images/:filename`

Elimina un archivo de imagen del repositorio.

**Restricciones:**
- No se puede eliminar una imagen activa en `gallery.config.json`
- Dispara `git commit + push` para que el archivo desaparezca del sitio en producción

**Flujo interno:**
1. Verificar que el archivo no está en `gallery.config.json`
2. Eliminar el archivo de `/public/galeria/`
3. `git add -A && git commit -m "remove: imagen eliminada desde panel admin" && git push origin main`

**Respuesta 200:** `{ "ok": true, "deployTriggered": true }`  
**Respuesta 409:** `{ "error": "La imagen está activa en la galería. Quítala primero." }`  
**Respuesta 404:** `{ "error": "Imagen no encontrada" }`

---

## 5. Módulo Media — Subida de imágenes de portada

El formulario de nueva/editar publicación permite subir una imagen de portada para el post.

### Endpoint requerido

```
POST   /api/media/upload
```

#### `POST /api/media/upload`

**Body:** `multipart/form-data`
| Campo | Tipo | Descripción |
|---|---|---|
| `file` | File | JPG, PNG o WebP — máx. 2 MB |
| `context` | string | `"cover"` — para organización interna |

**Respuesta 201:**
```json
{
  "url": "https://dominio.com/media/cover-la-lectura-acto-politico.jpg",
  "alt": ""
}
```

La URL devuelta se guarda en `Post.coverUrl`.

---

## 6. Comportamientos generales del API

| Regla | Detalle |
|---|---|
| Formato | JSON en todas las respuestas (`Content-Type: application/json`) |
| Errores | Siempre devolver `{ "error": "mensaje legible" }` — nunca stack traces en producción |
| Fechas | ISO 8601 en UTC (`2025-09-15T09:18:00Z`) |
| CORS | Solo permitir origen del dominio propio del sitio |
| Rate limiting | Recomendado: 60 req/min por IP en endpoints de escritura |
| Códigos HTTP | Usar semánticamente: 200, 201, 400, 401, 403, 404, 409, 413, 500 |

---

## 7. Variables de entorno requeridas

| Variable | Módulo | Descripción |
|---|---|---|
| `AUTH_SECRET` | Auth | Clave para firmar tokens de sesión (mín. 32 caracteres) |
| `ADMIN_EMAIL` | Auth | Email del usuario administrador inicial |
| `ADMIN_PASSWORD_HASH` | Auth | Hash bcrypt de la contraseña inicial |
| `GIT_USER_NAME` | Galería | Nombre que aparece en los commits automáticos |
| `GIT_USER_EMAIL` | Galería | Email que aparece en los commits automáticos |
| `GITHUB_TOKEN` | Galería | Personal Access Token con permisos `repo` para hacer push y consultar Actions API |
| `GITHUB_REPO` | Galería | `usuario/nombre-repositorio` — destino del push |
| `GITHUB_BRANCH` | Galería | Rama destino del push, normalmente `main` |
| `MEDIA_STORAGE_PATH` | Media | Ruta local donde se guardan las imágenes subidas |
| `DATABASE_URL` | Blog | Solo si se migra de archivos `.md` a base de datos relacional |

---

## 8. Notas de migración

Al migrar de GitHub Pages a hosting propio, los pasos necesarios para activar el backend son:

1. **Cambiar el output de Astro** a `server` o `hybrid` en `astro.config.mjs`

2. **Actualizar `Gallery.astro`** — reemplazar el array hardcodeado por la lectura del JSON:
   ```typescript
   import galleryConfig from '../../../gallery.config.json';
   const images = galleryConfig.images;
   ```

3. **Crear `gallery.config.json`** en la raíz del repo con la selección inicial (copiar el array activo de `Gallery.astro`)

4. **Configurar git en el servidor** — el proceso backend necesita poder hacer push al repositorio:
   ```bash
   git config user.name  "$GIT_USER_NAME"
   git config user.email "$GIT_USER_EMAIL"
   # Autenticación vía GITHUB_TOKEN en la URL remota:
   git remote set-url origin https://$GITHUB_TOKEN@github.com/$GITHUB_REPO.git
   ```

5. **Conectar la UI del panel** — reemplazar los `console.log('[Backend pendiente]…')` en los scripts del panel por `fetch()` a los endpoints de este contrato. En `admin/gallery.astro`, el botón "Guardar galería" debe:
   - Llamar a `PUT /api/gallery`
   - Mostrar estado `"Publicando…"` mientras espera
   - Al recibir 200, mostrar `"¡Listo! Cambios visibles en ~3 minutos"`
   - Opcionalmente: polling a `GET /api/gallery/deploy-status` cada 15 segundos hasta `status: "success"`

6. **Configurar la base de datos** — los posts actualmente viven como archivos `.md` en `src/content/blog/`. El backend puede continuar escribiendo `.md` (más simple, coherente con Astro Content Collections) o migrar a una base de datos (PostgreSQL, SQLite, Supabase)

7. **Proteger rutas** — agregar middleware de autenticación que intercepte todas las rutas `/admin/*` y `/api/*`

---

*Última actualización: 2026-06-17 — Arquitectura de galería definida como Opción A (escritura directa + rebuild automático vía GitHub Actions).*
