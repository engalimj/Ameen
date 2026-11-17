import { readFile } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/storage";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic" };

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const { name } = await params;
  if (!/^[\w-]+\.(jpg|png|webp|heic)$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(data, {
      headers: { "Content-Type": MIME[name.split(".").pop()!], "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
