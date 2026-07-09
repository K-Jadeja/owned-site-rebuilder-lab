// scripts/utils/safe-json.mjs
// Safe JSON read/write helpers. Pretty-prints; creates parent dirs.

import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, 'utf8');
  return filePath;
}

export async function writeText(filePath, text) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, text, 'utf8');
  return filePath;
}

export async function readJson(filePath) {
  try {
    const txt = await fs.readFile(filePath, 'utf8');
    return JSON.parse(txt);
  } catch (err) {
    return null;
  }
}

export async function readText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

export async function fileExists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export function nowIso() {
  return new Date().toISOString();
}