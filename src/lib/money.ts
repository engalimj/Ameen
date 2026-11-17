/** Amounts are stored in halalas (1 SAR = 100 halalas). */
export function formatSAR(halalas: number, locale: string) {
  const value = halalas / 100;
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function sarToHalalas(input: string | number) {
  const n = typeof input === "number" ? input : Number(String(input).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
