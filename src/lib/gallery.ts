import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export function getGaleriaDir(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return path.join(process.cwd(), isProd ? 'dist/client/galeria' : 'public/galeria');
}

export function getCoversDir(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return path.join(process.cwd(), isProd ? 'dist/client/covers' : 'public/covers');
}

// Config lives inside the galeria volume so persiste across redeploys
export function getConfigPath(): string {
  return path.join(getGaleriaDir(), 'gallery.config.json');
}

export interface GalleryImage {
  file: string;
  alt: string;
}

export interface GalleryConfig {
  images: GalleryImage[];
  updatedAt: string;
  updatedBy: string;
}

export function readGalleryConfig(): GalleryConfig {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    // Fallback: try legacy location at project root
    const legacy = path.join(process.cwd(), 'gallery.config.json');
    if (existsSync(legacy)) {
      return JSON.parse(readFileSync(legacy, 'utf-8'));
    }
    return { images: [], updatedAt: new Date().toISOString(), updatedBy: 'admin' };
  }
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

export function writeGalleryConfig(images: GalleryImage[], updatedBy: string): GalleryConfig {
  const dir = getGaleriaDir();
  mkdirSync(dir, { recursive: true });
  const config: GalleryConfig = { images, updatedAt: new Date().toISOString(), updatedBy };
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + '\n');
  return config;
}
