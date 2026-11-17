// Fails if any language file is missing keys that en.json has.
import { readFileSync, readdirSync } from "fs";
const dir = new URL("../src/i18n/", import.meta.url);
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const en = new Set(flat(JSON.parse(readFileSync(new URL("en.json", dir)))));
let bad = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "en.json")) {
  const keys = new Set(flat(JSON.parse(readFileSync(new URL(f, dir)))));
  const missing = [...en].filter((k) => !keys.has(k));
  if (missing.length) { bad++; console.error(`${f} is missing ${missing.length} keys:`, missing.join(", ")); }
  else console.log(`${f}: all ${en.size} keys present`);
}
process.exit(bad ? 1 : 0);
