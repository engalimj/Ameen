import "server-only";
// Photo storage. Development keeps files in ./uploads and serves them through
// /api/files/<name>. In production, swap saveFile for a Saudi-region object
// store (S3-compatible) and return its URL; nothing else needs to change.
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };

export async function saveFile(file: File): Promise<string | null> {
  if (!file || file.size === 0 || file.size > MAX_BYTES) return null;
  const ext = TYPES[file.type];
  if (!ext) return null;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/api/files/${name}`;
}

export async function saveFiles(files: FormDataEntryValue[]) {
  const urls: string[] = [];
  for (const f of files) if (f instanceof File) {
    const url = await saveFile(f);
    if (url) urls.push(url);
  }
  return urls;
}
