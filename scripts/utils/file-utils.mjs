// scripts/utils/file-utils.mjs
// Small helpers for pathing and filesystem hygiene.

import path from 'node:path';
import { promises as fs } from 'node:fs';

export const ROOT = process.cwd();

export function p(...parts) {
  return path.join(ROOT, ...parts);
}

export async function listFiles(dir, ext = null) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let files = entries.filter((e) => e.isFile()).map((e) => e.name);
    if (ext) files = files.filter((f) => f.endsWith(ext));
    return files.map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

export async function fileSize(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

export function formatBytes(n) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${u[i]}`;
}