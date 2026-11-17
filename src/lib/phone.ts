/** Normalise Saudi mobile numbers to E.164 (+9665XXXXXXXX). Returns null if invalid. */
export function normalizePhone(raw: string): string | null {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  let s = raw.replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d))).replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (s.startsWith("+966")) s = s.slice(4);
  else if (s.startsWith("966")) s = s.slice(3);
  if (s.startsWith("0")) s = s.slice(1);
  if (!/^5\d{8}$/.test(s)) return null;
  return "+966" + s;
}
