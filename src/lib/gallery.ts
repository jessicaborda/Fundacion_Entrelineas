import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export const CONFIG_PATH = path.join(process.cwd(), 'gallery.config.json');

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
  if (!existsSync(CONFIG_PATH)) {
    return { images: [], updatedAt: new Date().toISOString(), updatedBy: 'admin' };
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

export function writeGalleryConfig(images: GalleryImage[], updatedBy: string): GalleryConfig {
  const config: GalleryConfig = { images, updatedAt: new Date().toISOString(), updatedBy };
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
  return config;
}

function git(args: string[]): { ok: boolean; output: string } {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf-8',
    env: process.env,
  });
  const output = (result.stdout ?? '') + (result.stderr ?? '');
  return { ok: result.status === 0, output };
}

export function triggerGitPush(message: string, files: string[]): boolean {
  const token  = import.meta.env.GITHUB_TOKEN;
  const repo   = import.meta.env.GITHUB_REPO;
  const branch = import.meta.env.GITHUB_BRANCH ?? 'main';
  const name   = import.meta.env.GIT_USER_NAME  ?? 'Entrelíneas Admin';
  const email  = import.meta.env.GIT_USER_EMAIL ?? 'admin@fundacionentrelineas.com';

  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN o GITHUB_REPO no configurados');
  }

  git(['config', 'user.name', name]);
  git(['config', 'user.email', email]);
  git(['remote', 'set-url', 'origin', `https://${token}@github.com/${repo}.git`]);
  git(['add', ...files]);

  // Comprobar si hay algo staged antes de hacer commit
  const diff = git(['diff', '--cached', '--exit-code']);
  if (diff.ok) return false; // Nada que commitear

  const commit = git(['commit', '-m', message]);
  if (!commit.ok) throw new Error(`git commit falló: ${commit.output}`);

  const push = git(['push', 'origin', branch]);
  if (!push.ok) throw new Error(`git push falló: ${push.output}`);

  return true;
}
